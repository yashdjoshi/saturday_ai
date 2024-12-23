import { IAgentRuntime, Plugin } from "@ai16z/eliza";

interface Council {
  id: string;
  members: string[];
  status: 'pending' | 'active' | 'complete';
  ratings: { [member: string]: number };
  crypto: string;
  analysis: string;
}

export class CouncilManager implements Plugin {
  name = "council";
  description = "Manages crypto rating councils";
  private councils: Map<string, Council> = new Map();
  private readonly councilMembers = [
    'CryptoSage',
    'TokenWhisperer', 
    'BlockchainOracle',
    'DeFiGuru',
    'ChartMaster'
  ];

  async initialize(runtime: IAgentRuntime): Promise<void> {
    // Plugin initialization if needed
  }

  suggestCouncil(crypto: string): Council {
    const id = Math.random().toString(36).substring(7);
    // Randomly select 3 members for each council
    const members = [...this.councilMembers]
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    const council: Council = {
      id,
      members,
      status: 'pending',
      ratings: {},
      crypto,
      analysis: ''
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

    // Generate ratings and analysis for each member
    council.members.forEach(member => {
      council.ratings[member] = Math.floor(Math.random() * 10) + 1;
    });

    const avgRating = Object.values(council.ratings).reduce((a, b) => a + b, 0) / council.members.length;

    // Generate analysis based on the rating
    const sentiment = avgRating >= 7 ? 'bullish' : avgRating >= 4 ? 'neutral' : 'bearish';
    const analyses = {
      bullish: `${council.crypto} looking absolutely based rn fam! The fundamentals are strong af and the charts are screaming moon mission! 🚀`,
      neutral: `${council.crypto} giving mixed signals bro. Might need to zoom out and DYOR. NFA but watch this one closely.`,
      bearish: `${council.crypto} looking kinda sus ngl. Charts giving bearish vibes, might want to touch grass before aping in.`
    };

    council.analysis = analyses[sentiment];
    council.status = 'complete';

    return `Council Rating for ${council.crypto}: ${avgRating.toFixed(1)}/10 🎯\n\n` +
           `${council.analysis}\n\n` +
           `Individual ratings:\n` +
           Object.entries(council.ratings)
             .map(([member, rating]) => `${member}: ${rating}/10`)
             .join('\n');
  }

  getCouncil(id: string): Council | undefined {
    return this.councils.get(id);
  }
}
