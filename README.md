# Crypto Rating Council Bot

An AI-powered crypto analysis bot featuring a council of expert personas who provide detailed ratings and analysis for cryptocurrencies.

## Features

### Council Analysis System
- Multi-stage analysis process covering:
  - On-chain metrics
  - Social sentiment
  - Market insights
  - Design/UI evaluation
  - Value proposition assessment
- Risk level assessment (Low/Medium/High)
- Detailed scoring across multiple categories
- Entertaining persona-based feedback

### Expert Council Members
- CryptoSage (Technical Analysis)
- TokenWhisperer (Tokenomics)
- BlockchainOracle (On-Chain Analysis)
- DeFiGuru (DeFi Mechanics)
- ChartMaster (Market Psychology)

### Rating Process
1. Trigger analysis with `$TICKER` or `rate TICKER`
2. Council assembles and performs initial analysis
3. Confirm rating generation with `confirm` command
4. Receive detailed multi-part analysis with scores and insights

## Getting Started

1. Clone the repository
2. Copy environment template:
```bash
cp .env.example .env
```

3. Configure your API keys in `.env`:
```
OPENAI_API_KEY=your_key_here
DISCORD_TOKEN=your_token_here
```

4. Install dependencies:
```bash
pnpm install
```

5. Start the bot:
```bash
pnpm start
```

## Usage

### Basic Commands
- `$BTC` or `rate BTC` - Request analysis for Bitcoin
- `confirm` - Generate final rating after council assembles
- `next` - Progress through analysis stages (when available)

### Example Output
```
🎯 $BTC Rating: 8.5/10

📊 Metrics:
- Technical Score: 85/100
- Fundamental Score: 90/100
- Meme Potential: 75/100

Risk Level: LOW

Analysis: Bitcoin looking absolutely based! Technical analysis 
screaming moon mission, fundamentals thicc, and meme potential
off the charts! WAGMI! 🚀
```

## Character Configuration

Custom characters can be loaded using:
```bash
pnpm start --characters="path/to/character.json"
```

Multiple character files can be loaded simultaneously.

## Supported Clients
- Discord
- Twitter
- Telegram
- Direct CLI interface

Enable clients in character config:
```json
{
  "clients": ["discord", "twitter", "telegram"]
}
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Open pull request

## License

MIT License - see LICENSE file for details
