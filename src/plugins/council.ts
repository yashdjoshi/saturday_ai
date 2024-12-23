import {IAgentRuntime, Memory, Plugin, State} from "@ai16z/eliza";

interface ActionContext {
  message: {
    content: {
      text: string;
    };
  };
  response: string;
}

interface CouncilMember {
  name: string;
  expertise: string;
  catchphrase: string;
}

type RiskLevel = 'low' | 'medium' | 'high';
type CouncilStatus = 'pending' | 'active' | 'complete';

interface TokenData {
  price: number;
  volume24h: number;
  marketCap: number;
  priceChange24h: number;
  holders: number;
  liquidityUSD: number;
}

interface AnalysisStage {
  name: string;
  completed: boolean;
  score: number;
  analysis: string;
  details: {
    onChain?: {
      github?: string;
      transactions?: string;
    };
    social?: {
      twitter?: string;
      telegram?: string;
    };
    market?: {
      firstMover: boolean;
      competitors: string[];
      team?: string;
    };
    design?: {
      website?: string;
      artStyle?: string;
    };
    value?: {
      innovation?: string;
      useCase?: string;
    };
  };
}

interface Council {
  id: string;
  members: CouncilMember[];
  status: CouncilStatus;
  ratings: Record<string, number>;
  crypto: string;
  analysis: string;
  currentStage: number;
  stages: AnalysisStage[];
  riskLevel: RiskLevel;
  tokenData?: TokenData;
}

interface CouncilRating {
  memberName: string;
  score: number;
  comment?: string;
}

interface CouncilAnalysis {
  technicalScore: number;
  fundamentalScore: number;
  memePotential: number;
  riskLevel: RiskLevel;
  summary: string;
}

export class CouncilPlugin implements Plugin {
  name = "council";
  description = "Manages crypto rating councils";
  private councils: Map<string, Council>;
  private readonly councilSize = 3;
  
  constructor() {
    this.councils = new Map<string, Council>();
  }
  private readonly councilMembers: CouncilMember[] = [
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

  async initialize(runtime: IAgentRuntime): Promise<void> {
    runtime.registerAction({
      name: "handleCryptoMessages",
      similes: ["crypto rating", "rate crypto", "crypto council"], // Alternative triggers
      description: "Handles messages related to crypto ratings and council confirmations.",
      examples: [
        [
          {
            user: "{{user1}}",
            content: { text: "Rate BTC" }
          },
          {
            user: "{{agentName}}",
            content: { text: "Yo fam! Assembling council #1 to rate $BTC!" }
          }
        ],
        [
          {
            user: "{{user1}}",
            content: { text: "What do you think about ETH?" }
          },
          {
            user: "{{agentName}}",
            content: { text: "Yo fam! Assembling council #2 to rate $ETH!" }
          }
        ],
        [
          {
            user: "{{user1}}",
            content: { text: "Confirm" }
          },
          {
            user: "{{agentName}}",
            content: { text: "Council confirmed! Here's the rating: ..." }
          }
        ]
      ],
      validate: async (runtime: IAgentRuntime, message: { content: { text: string } }) => {
        // Validation logic to determine if the action should run
        console.log("Validating message:", message.content.text);
        const text = message.content.text.toLowerCase();
        const isValid = text.includes("rate") || text.includes("what do you think about") || text.includes("confirm");
        console.log("Is valid:", isValid);
        return isValid;
      },
      handler: async (runtime: IAgentRuntime, message: Memory, state: State, options: any, callback: any) => {
        console.log("Handler called with message:", message.content.text);
        const text = message.content.text.toLowerCase();

        // Check for confirmation command first
        if (text.includes("confirm")) {
          console.log("Detected confirm command");
          const activeCouncils = Array.from(this.councils.values()).filter((c: Council) => c.status === "pending");
          console.log("Active councils:", activeCouncils);

          if (activeCouncils.length > 0) {
            const council = activeCouncils[0] as Council;
            console.log("Found pending council:", council);
            this.confirmCouncil(council.id);

            const rating = this.collectRatings(council.id);
            console.log("Generated rating:", rating);
            callback({
              text: rating,
              type: "text"
            });
            return;
          } else {
            callback({
              text: "No active councils to confirm. Try starting a new one!",
              type: "text"
            });
            return;
          }
        }

        // Check if message is about rating a crypto
        if (text.includes("rate") || text.includes("what do you think about")) {
          console.log("Detected rate request");
          const supportedCryptos = ["btc", "eth", "sol", "doge", "shib"];
          const rateRegex = /(?:rate|about)\s+(\w+)(?:[^a-zA-Z]|$)/i;
          const cryptoMatch = text.match(rateRegex);

          if (cryptoMatch && cryptoMatch[1]) {
            const matchedCrypto = cryptoMatch[1].toLowerCase();
            if (supportedCryptos.includes(matchedCrypto)) {
              console.log("Matched crypto:", matchedCrypto);
              const crypto = matchedCrypto.toUpperCase();
              
              // Get token trade data
              const tokenData = await this.getTokenTradeData(crypto);
              
              // Show token stats immediately
              // Create and store council with token data
              const council = this.suggestCouncil(crypto, tokenData);
              console.log("Created council:", council);
              
              // Concise Twitter-friendly response
              const stats = `$${crypto} @ $${tokenData.price.toFixed(2)} | ${tokenData.priceChange24h.toFixed(1)}% 24h`;
              const members = council.members.map(m => `@${m.name}`).join(" ");
              
              callback({
                text: `📊 ${stats}\n\n🎯 Council #${council.id}:\n${members}\n\nSay 'confirm' for rating!`,
                type: "text"
              });
              return;
            }
          }
        }

        // Default response if no conditions are met
        callback({
          text: "I'm not sure what you're asking. Try 'rate BTC' or 'confirm'.",
          type: "text"
        });
        return;
      },
    });
  }

  suggestCouncil(crypto: string, tokenData: TokenData): Council {
    const id = Math.random().toString(36).substring(7);
    const members = [...this.councilMembers]
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    const stages = [
      {
        name: "On-chain Analysis",
        completed: false,
        score: 0,
        analysis: "",
        details: {}
      },
      {
        name: "Social Sentiment",
        completed: false,
        score: 0,
        analysis: "",
        details: {}
      },
      {
        name: "Market Insights",
        completed: false,
        score: 0,
        analysis: "",
        details: {}
      },
      {
        name: "Design and Art",
        completed: false,
        score: 0,
        analysis: "",
        details: {}
      },
      {
        name: "Value Proposition",
        completed: false,
        score: 0,
        analysis: "",
        details: {}
      }
    ];

    const council: Council = {
      id,
      members,
      status: 'pending',
      ratings: {},
      crypto,
      analysis: '',
      currentStage: 0,
      stages,
      riskLevel: 'medium',
      tokenData
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

    // Format a detailed response with individual ratings and analysis
    const ratings = council.members
      .map(m => `@${m.name} (${m.expertise}): ${council.ratings[m.name]}/10`)
      .join('\n');

    return `🎯 $${council.crypto} Rating: ${avgRating.toFixed(1)}/10\n\n📊 Tech: ${council.technicalScore}/100 | Fund: ${council.fundamentalScore}/100 | Meme: ${council.memePotential}/100\n\nRisk: ${council.riskLevel.toUpperCase()}\n\n${council.analysis}`;
  }

  getCouncil(id: string): Council | undefined {
    return this.councils.get(id);
  }

  async getTokenTradeData(crypto: string): Promise<TokenData> {
    try {
      // Mock data for demonstration - in production this would call real APIs
      return {
        price: Math.random() * 1000,
        volume24h: Math.random() * 1000000,
        marketCap: Math.random() * 1000000000,
        priceChange24h: (Math.random() * 20) - 10,
        holders: Math.floor(Math.random() * 100000),
        liquidityUSD: Math.random() * 1000000
      };
    } catch (error) {
      console.error("Error fetching token data:", error);
      throw error;
    }
  }

  formatTokenData(data: TokenData): string {
    return `$${data.price.toFixed(2)} | Vol: $${(data.volume24h/1e6).toFixed(1)}M | MCap: $${(data.marketCap/1e9).toFixed(1)}B | ${data.priceChange24h.toFixed(1)}% 24h`;
  }
}
