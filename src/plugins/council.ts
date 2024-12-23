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
  ratings: Record<string, CouncilRating>;
  crypto: string;
  analysis: string;
  currentStage: number;
  stages: AnalysisStage[];
  riskLevel: RiskLevel;
  tokenData?: TokenData;
  memberAnalyses: Record<string, string>;
  technicalScore?: number;
  fundamentalScore?: number;
  memePotential?: number;
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

  private activeCouncil: Council | null = null;

  async initialize(runtime: IAgentRuntime): Promise<void> {
    runtime.registerAction({
      name: "handleCryptoMessages",
      similes: ["crypto rating", "rate crypto", "crypto council"],
      description: "Handles messages related to crypto ratings and council confirmations",
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
        const text = message.content.text.toLowerCase();
        return text.includes("rate") || 
               text.includes("what do you think about") || 
               text.includes("address:") ||
               text.includes("confirm");
      },
      handler: async (runtime: IAgentRuntime, message: Memory, state: State, options: any, callback: any) => {
        console.log("Handler called with message:", message.content.text);
        const text = message.content.text.toLowerCase();
        
        // Handle rating requests
        if (text.includes("rate") || text.includes("what do you think about")) {
          const supportedCryptos = ["btc", "eth", "sol", "doge", "shib"];
          const rateRegex = /(?:rate|about)\s+(\w+)(?:[^a-zA-Z]|$)/i;
          const cryptoMatch = text.match(rateRegex);

          if (cryptoMatch && cryptoMatch[1]) {
            const matchedCrypto = cryptoMatch[1].toLowerCase();
            if (supportedCryptos.includes(matchedCrypto)) {
              const crypto = matchedCrypto.toUpperCase();
              
              // Get token data and create new council
              const tokenData = await this.getTokenTradeData(crypto);
              const council = this.suggestCouncil(crypto, tokenData);
              this.activeCouncil = council;

              // Generate and show initial analysis
              const analysis = await this.startAnalysis(council);
              callback({
                text: `🔍 Initial Analysis for $${crypto}:\n\n${analysis}`,
                type: "text"
              });

              // Show council suggestion in separate message
              const councilMsg = `👥 Suggested Council:\n` +
                council.members.map(m => `- ${m.name} (${m.expertise})\n  "${m.catchphrase}"`).join('\n') +
                `\n\nReply 'confirm' to proceed or 'change' for new council`;
      
              callback({
                text: councilMsg,
                type: "text"
              });
              return;
            }
          }
        }

        // Handle confirmation
        if (text.toLowerCase() === "confirm") {
          if (this.activeCouncil) {
            const council = this.activeCouncil;
            council.status = 'active';
            
            // Generate ratings
            council.members.forEach(member => {
              council.ratings[member.name] = {
                memberName: member.name,
                score: Math.floor(Math.random() * 4) + 6, // 6-10 range
                comment: this.generateMemberComment(member)
              };
            });

            // Calculate final rating
            const ratings = Object.values(council.ratings);
            const avgRating = ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length;

            const response = `Council Ratings for $${council.crypto}:\n\n` +
              ratings.map(r => `${r.memberName}: ${r.score}/10 - "${r.comment}"`).join('\n') +
              `\n\nOverall Rating: ${avgRating.toFixed(1)}/10\n` +
              this.generateSentiment(avgRating * 10); // Convert to 100 scale for sentiment

            callback({
              text: response,
              type: "text"
            });

            this.activeCouncil = null; // Reset active council
            return;
          }
        }

        // Default response if no conditions are met
        callback({
          text: "I'm not sure what you're asking. Try 'rate BTC' or 'confirm'.",
          type: "text"
        });
      }
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
      tokenData,
      memberAnalyses: {},
      technicalScore: 0,
      fundamentalScore: 0,
      memePotential: 0
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
      const rating: CouncilRating = {
        memberName: member.name,
        score: Math.floor(Math.random() * 10) + 1,
        comment: this.generateMemberComment(member)
      };
      council.ratings[member.name] = rating;
    });

    // Calculate scores
    if (council) {
      council.technicalScore = Math.floor(Math.random() * 100);
      council.fundamentalScore = Math.floor(Math.random() * 100);
      council.memePotential = Math.floor(Math.random() * 100);
    }
    
    const avgRating = Object.values(council.ratings).reduce((a, b) => a + b.score, 0) / council.members.length;
    
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

  async progressStage(id: string): Promise<string> {
    const council = this.councils.get(id);
    if (!council || council.status !== 'active') {
      return 'No active council found';
    }

    const currentStage = council.stages[council.currentStage];
    if (!currentStage) {
      council.status = 'complete';
      return this.generateFinalAnalysis(council);
    }

    // Generate analysis for current stage
    const analysis = await this.analyzeStage(council, currentStage);
    currentStage.completed = true;
    currentStage.analysis = analysis.analysis;
    currentStage.score = analysis.score;
    currentStage.details = analysis.details;

    // Move to next stage
    council.currentStage++;
    
    // Format stage completion message
    return `📊 Stage ${council.currentStage}/5: ${currentStage.name}\n${analysis.analysis}\nScore: ${analysis.score}/100\n\nSay 'next' to continue!`;
  }

  private async analyzeStage(council: Council, stage: AnalysisStage): Promise<{
    analysis: string;
    score: number;
    details: any;
  }> {
    const analyses: Record<string, () => Promise<any>> = {
      "On-chain Analysis": async () => {
        const score = Math.floor(60 + Math.random() * 40);
        const details = {
          github: "Active development, 120+ contributors",
          transactions: "High daily volume, healthy distribution"
        };
        return {
          analysis: `On-chain metrics looking bullish af! Github activity poppin, TX volume thicc 🔥`,
          score,
          details
        };
      },
      "Social Sentiment": async () => {
        const score = Math.floor(50 + Math.random() * 50);
        const details = {
          twitter: "Growing engagement",
          telegram: "Active community"
        };
        return {
          analysis: `Social metrics bussin fr fr! Twitter trending, TG community based 🚀`,
          score,
          details
        };
      },
      "Market Insights": async () => {
        const score = Math.floor(40 + Math.random() * 60);
        const details = {
          firstMover: true,
          competitors: ["comp1", "comp2"],
          team: "Doxxed and based"
        };
        return {
          analysis: `Market position: absolute chad energy! Team doxxed & based, competition ngmi 💪`,
          score,
          details
        };
      },
      "Design and Art": async () => {
        const score = Math.floor(70 + Math.random() * 30);
        const details = {
          website: "Clean UI/UX",
          artStyle: "Premium quality"
        };
        return {
          analysis: `Design aesthetic: chef's kiss! Website clean af, branding on point 🎨`,
          score,
          details
        };
      },
      "Value Proposition": async () => {
        const score = Math.floor(55 + Math.random() * 45);
        const details = {
          innovation: "Revolutionary tech",
          useCase: "Strong utility"
        };
        return {
          analysis: `Utility check: solving real problems! Innovation level: galaxy brain 🧠`,
          score,
          details
        };
      }
    };

    return analyses[stage.name]?.() || {
      analysis: "Analysis unavailable",
      score: 0,
      details: {}
    };
  }

  private generateFinalAnalysis(council: Council): string {
    const avgScore = council.stages.reduce((sum, stage) => sum + stage.score, 0) / council.stages.length;
    const riskLevel = avgScore > 75 ? 'low' : avgScore > 50 ? 'medium' : 'high';
    
    // Format individual council member ratings
    const memberRatings = council.members.map(member => 
      `${member.name}: ${council.ratings[member.name]?.score || 0}/10`
    ).join('\n');

    const summary = `Council Ratings for $${council.crypto}:\n\n${memberRatings}\n\n` +
      `Overall Score: ${avgScore.toFixed(1)}/10\n\n` +
      this.generateSentiment(avgScore);

    council.status = 'complete';
    return summary;
  }

  private async startAnalysis(council: Council): Promise<string> {
    try {
      // Generate mock data for each category
      const analyses = await Promise.all(
        council.stages.map(stage => this.analyzeStage(council, stage))
      );
      
      // Store analyses
      analyses.forEach((analysis, index) => {
        council.stages[index].analysis = analysis.analysis;
        council.stages[index].score = analysis.score;
        council.stages[index].details = analysis.details;
      });

      // Get council member ratings
      const memberAnalyses = await this.getMemberAnalyses(council);
      council.memberAnalyses = memberAnalyses;

      return this.formatAnalysis(council);
    } catch (error) {
      console.error("Error in startAnalysis:", error);
      return "Error analyzing project. Please try again.";
    }
  }

  private async getMemberAnalyses(council: Council): Promise<Record<string, string>> {
    try {
      const analyses: Record<string, string> = {};
      
      for (const member of council.members) {
        const analysis = await this.generateMemberAnalysis(member, council);
        analyses[member.name] = analysis;
        const rating: CouncilRating = {
          memberName: member.name,
          score: Math.floor(Math.random() * 40) + 60, // 60-100 range
          comment: this.generateMemberComment(member)
        };
        council.ratings[member.name] = rating;
      }

      return analyses;
    } catch (error) {
      console.error("Error in getMemberAnalyses:", error);
      return {};
    }
  }

  private generateMemberComment(member: CouncilMember): string {
    const comments = {
      'CryptoSage': 'Charts looking absolutely based!',
      'TokenWhisperer': 'Tokenomics check out, ser',
      'BlockchainOracle': 'On-chain metrics bullish af',
      'DeFiGuru': 'Smart contracts looking clean',
      'ChartMaster': 'Market structure is valid'
    };
    return comments[member.name] || 'Looking bullish!';
  }

  private async generateMemberAnalysis(member: CouncilMember, council: Council): Promise<string> {
    return `${member.name} (${member.expertise}): "${member.catchphrase}"\n` +
           `Rating: ${council.ratings[member.name]?.score || 0}/100`;
  }

  private formatAnalysis(council: Council): string {
    try {
      const stageAnalysis = council.stages
        .map(stage => `${stage.name}: ${stage.score}/100\n${stage.analysis}`)
        .join('\n\n');
      
      const memberAnalysis = Object.values(council.memberAnalyses || {}).join('\n');
      
      const finalScore = Object.values(council.ratings)
        .reduce((sum, rating) => sum + rating.score, 0) / 
        (Object.keys(council.ratings).length || 1);

      return `🔍 Analysis for $${council.crypto}\n\n` +
             `${stageAnalysis}\n\n` +
             `👥 Council Ratings:\n${memberAnalysis}\n\n` +
             `📊 Final Score: ${finalScore.toFixed(1)}/100\n` +
             `${this.generateSentiment(finalScore)}`;
    } catch (error) {
      console.error("Error in formatAnalysis:", error);
      return `Error formatting analysis for ${council.crypto}`;
    }
  }

  private async getInitialAnalysis(crypto: string): Promise<Record<string, number>> {
    // Mock initial analysis data
    return {
      technical: Math.floor(Math.random() * 100),
      fundamental: Math.floor(Math.random() * 100),
      social: Math.floor(Math.random() * 100),
      market: Math.floor(Math.random() * 100),
      risk: Math.floor(Math.random() * 100)
    };
  }

  private formatInitialAnalysis(analysis: Record<string, number>): string {
    return `Technical Score: ${analysis.technical}/100\n` +
           `Fundamental Score: ${analysis.fundamental}/100\n` +
           `Social Score: ${analysis.social}/100\n` +
           `Market Score: ${analysis.market}/100\n` +
           `Risk Score: ${analysis.risk}/100`;
  }

  private generateSentiment(score: number): string {
    if (score > 75) {
      return "WAGMI! This one's definitely gonna make it! 🚀🌕";
    } else if (score > 50) {
      return "Not bad anon, DYOR but could be based! 👀";
    } else {
      return "Major red flags fam, probably ngmi 💀";
    }
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
