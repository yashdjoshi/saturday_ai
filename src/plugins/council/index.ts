import { elizaLogger } from "@ai16z/eliza";
import {
  Action,
  IAgentRuntime,
  Memory,
  Plugin,
  State,
} from "@ai16z/eliza";

interface CouncilMember {
  name: string;
  expertise: string;
  catchphrase: string;
}

type RiskLevel = 'low' | 'medium' | 'high';
type CouncilStatus = 'pending' | 'active' | 'complete';

interface Council {
  id: string;
  members: CouncilMember[];
  status: CouncilStatus;
  ratings: Record<string, number>;
  crypto: string;
  analysis: string;
  technicalScore: number;
  fundamentalScore: number;
  memePotential: number;
  riskLevel: RiskLevel;
}

const councilMembers: CouncilMember[] = [
  {
    name: 'CryptoSage',
    expertise: 'Technical Analysis',
    catchphrase: 'The charts never lie, but sometimes they do a little trolling'
  },
  {
    name: 'TokenWhisperer', 
    expertise: 'Tokenomics',
    catchphrase: 'If the tokenomics are mid, you gonna stay poor kid'
  },
  {
    name: 'BlockchainOracle',
    expertise: 'On-Chain Analysis', 
    catchphrase: 'The blockchain sees all, especially your poor life choices'
  },
  {
    name: 'DeFiGuru',
    expertise: 'DeFi Mechanics',
    catchphrase: 'Touch grass? I only touch smart contracts'
  },
  {
    name: 'ChartMaster',
    expertise: 'Market Psychology',
    catchphrase: 'When there\'s blood in the streets... buy more crypto'
  }
];

class CouncilManager {
  private councils: Map<string, Council>;
  private readonly councilSize = 3;
  
  constructor() {
    this.councils = new Map<string, Council>();
  }

  suggestCouncil(crypto: string): Council {
    const id = Math.random().toString(36).substring(7);
    const members = [...councilMembers]
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    const council: Council = {
      id,
      members,
      status: 'pending',
      ratings: {},
      crypto,
      analysis: '',
      technicalScore: 0,
      fundamentalScore: 0,
      memePotential: 0,
      riskLevel: 'medium'
    };
    
    this.councils.set(id, council);
    return council;
  }

  confirmCouncil(id: string): boolean {
    const council = this.councils.get(id);
    if (council && council.status === 'pending') {
      council.status = 'active';
      return true;
    }
    return false;
  }

  collectRatings(id: string): string {
    const council = this.councils.get(id);
    if (!council || council.status !== 'active') {
      return 'Council not found or not active';
    }

    // Generate detailed ratings
    council.members.forEach(member => {
      council.ratings[member.name] = Math.floor(Math.random() * 10) + 1;
    });

    // Calculate scores
    council.technicalScore = Math.floor(Math.random() * 100);
    council.fundamentalScore = Math.floor(Math.random() * 100);
    council.memePotential = Math.floor(Math.random() * 100);
    
    const avgRating = Object.values(council.ratings).reduce((a, b) => a + b, 0) / council.members.length;
    
    // Determine risk level
    council.riskLevel = avgRating > 7 ? 'low' : avgRating > 4 ? 'medium' : 'high';

    // Generate detailed analysis
    const sentiment = avgRating >= 7 ? 'bullish' : avgRating >= 4 ? 'neutral' : 'bearish';
    const analyses = {
      bullish: `${council.crypto} is looking absolutely based! Technical analysis is screaming moon mission, fundamentals are thicc, and the meme potential is off the charts! NFA but your grandkids will thank you for this one fam! 🚀`,
      neutral: `${council.crypto} giving mixed signals rn. The charts are crabbing harder than your ex's attitude. Might need to zoom out and DYOR. Keep some dry powder ready anon.`,
      bearish: `${council.crypto} looking more sus than a 4am discord pump. Charts giving major bearish vibes, tokenomics looking shakier than a paper-handed trader. Might want to touch grass before aping in.`
    };

    council.analysis = analyses[sentiment];
    council.status = 'complete';

    // Format the response as a series of tweet-sized chunks
    const tweets = [];
    
    // Tweet 1: Overall rating and risk
    tweets.push(
      `${council.crypto} Council Rating 🎯\n` +
      `Overall: ${avgRating.toFixed(1)}/10\n` +
      `Risk: ${council.riskLevel.toUpperCase()}\n` +
      `Tech: ${council.technicalScore}/100 | Fund: ${council.fundamentalScore}/100 | Meme: ${council.memePotential}/100`
    );

    // Tweet 2: Analysis
    tweets.push(council.analysis);

    // Tweet 3: Individual ratings
    const ratings = council.members
      .map(m => `${m.name}: ${council.ratings[m.name]}/10`)
      .join(' | ');
    tweets.push(`Council Votes:\n${ratings}`);

    // Add tweet numbering
    return tweets
      .map((tweet, i) => `${i + 1}/${tweets.length} ${tweet}`)
      .join('\n\n---\n\n');
  }

  getCouncil(id: string): Council | undefined {
    return this.councils.get(id);
  }

  getActiveCouncils(): Council[] {
    return Array.from(this.councils.values()).filter(c => c.status === 'pending');
  }
}

const manager = new CouncilManager();

const councilAction: Action = {
  name: "handleCryptoMessages",
  similes: ["crypto rating", "rate crypto", "crypto council"],
  description: "Handles messages related to crypto ratings and council confirmations.",
  examples: [
    {
      input: { content: { text: "Rate BTC" } },
      output: { content: { text: "Yo fam! Assembling council #1 to rate $BTC!", action: "handleCryptoMessages" } }
    },
    {
      input: { content: { text: "Confirm" } },
      output: { content: { text: "Council confirmed! Here's the rating...", action: "handleCryptoMessages" } }
    }
  ],
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const text = message.content.text.toLowerCase();
    return text.includes("rate") || 
           text.includes("what do you think about") || 
           text.includes("confirm");
  },
  handler: async (runtime: IAgentRuntime, message: Memory, state: State, options: any, callback: any) => {
    const text = message.content.text.toLowerCase();

    // Check if message is about rating a crypto
    if (text.includes("rate") || text.includes("what do you think about")) {
      const supportedCryptos = ["btc", "eth", "sol", "doge", "shib"];
      const cryptoRegex = new RegExp(`\\b(${supportedCryptos.join("|")}|[a-z]{3,})\\b`, "i");
      const cryptoMatch = text.match(cryptoRegex);

      if (cryptoMatch) {
        const crypto = cryptoMatch[0].toUpperCase();
        const council = manager.suggestCouncil(crypto);

        if (council) {
          return {
            text: `Yo fam! Assembling council #${council.id} to rate $${crypto}! Got @${council.members.map((m) => m.name).join(" @")} on deck! Reply 'confirm' to get their takes! 🚀`
          };
        } else {
          return {
            text: `Sorry, couldn't assemble a council for $${crypto}. Try again later!`
          };
        }
      }
    }

    // Check for council confirmation
    if (text.includes("confirm")) {
      const activeCouncils = Array.from(Object.values(manager.getActiveCouncils()))
        .filter((c: Council) => c.status === "pending");

      if (activeCouncils.length > 0) {
        const council = activeCouncils[0];
        manager.confirmCouncil(council.id);

        const rating = manager.collectRatings(council.id);
        return { text: rating };
      } else {
        return {
          text: "No active councils to confirm. Try starting a new one!"
        };
      }
    }

    return {
      text: "I'm not sure what you're asking. Try 'rate BTC' or 'confirm'."
    };
  }
};

export const councilPlugin: Plugin = {
  name: "council",
  description: "Manages crypto rating councils",
  actions: [councilAction],
  evaluators: [],
  providers: []
};
