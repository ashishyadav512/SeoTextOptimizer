# SEO Text Analyzer

An advanced React-based SEO text analysis tool that provides intelligent, real-time optimization suggestions for content creators. The application offers comprehensive keyword analysis, insertion functionality, and immediate feedback on content optimization strategies.

## Features

### 📊 Content Analysis
- **Readability Score**: Automated readability analysis using Flesch Reading Ease algorithm
- **SEO Score**: Comprehensive SEO scoring based on keyword density, content structure, and optimization factors
- **Keyword Density**: Real-time calculation of keyword frequency and distribution
- **Word & Character Count**: Live content statistics tracking

### 🔍 Intelligent Keyword Suggestions
- **Contextual Keywords**: AI-powered keyword generation based on content context
- **Difficulty Assessment**: Low/Medium/High difficulty ratings for keyword targeting
- **Volume Estimates**: Search volume indicators for keyword prioritization
- **Topic Clustering**: Related keyword grouping for comprehensive optimization

### ✨ Smart Keyword Insertion
- **Individual Insertion**: One-click keyword insertion with optimal positioning
- **Bulk Insertion**: Select and insert multiple keywords simultaneously
- **Natural Language Processing**: Maintains content coherence and readability
- **Duplicate Prevention**: Advanced algorithms prevent keyword repetition and awkward phrasing
- **Grammar Preservation**: Intelligent insertion maintains proper sentence structure

### 📈 Optimization Tips
- **Real-time Feedback**: Immediate suggestions for content improvement
- **Color-coded Alerts**: Visual indicators for success, warning, error, and info messages
- **Actionable Recommendations**: Specific steps to enhance SEO performance
- **Progress Tracking**: Monitor optimization improvements over time

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for responsive styling
- **Radix UI** component library
- **TanStack Query** for state management
- **Wouter** for client-side routing
- **React Hook Form** with Zod validation
- **Lucide React** for icons

### Backend
- **Express.js** with TypeScript
- **Drizzle ORM** for data management
- **Zod** for schema validation
- **In-memory storage** for session data
- **RESTful API** architecture

### Analysis
- **TextRazor API** for natural language processing and semantic analysis

### Development Tools
- **Vite** for development and building
- **ESBuild** for fast compilation
- **PostCSS** with Autoprefixer
- **TypeScript** for type safety

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd seo-text-analyzer
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5000`

## Usage

### Analyzing Content

1. **Enter Your Content**: Paste or type your text into the main content area
2. **Click Analyze**: Press the "Analyze Content" button to generate insights
3. **Review Scores**: Check your readability and SEO scores in the results panel
4. **View Keywords**: Browse suggested keywords with difficulty and volume indicators

### Inserting Keywords

#### Individual Insertion
1. Click the "Insert" button next to any suggested keyword
2. The keyword will be intelligently placed in your content
3. View the updated content with highlighted insertions

#### Bulk Insertion
1. Select multiple keywords using the checkboxes
2. Choose "Insert Selected Keywords" for bulk optimization
3. Review the optimized content with all insertions

### Understanding Scores

- **Readability Score (0-100)**: Higher scores indicate easier-to-read content
  - 90-100: Very Easy
  - 80-90: Easy
  - 70-80: Fairly Easy
  - 60-70: Standard
  - 50-60: Fairly Difficult
  - 30-50: Difficult
  - 0-30: Very Difficult

- **SEO Score (0-100)**: Higher scores indicate better SEO optimization
  - 80-100: Excellent
  - 60-80: Good
  - 40-60: Fair
  - 20-40: Poor
  - 0-20: Very Poor

## API Endpoints

### Analysis
- `POST /api/analyze` - Analyze content and generate suggestions
- `POST /api/insert-keyword` - Insert a single keyword
- `POST /api/insert-keywords` - Bulk insert multiple keywords

### Request/Response Examples

#### Content Analysis
```typescript
// Request
POST /api/analyze
{
  "content": "Your content text here..."
}

// Response
{
  "readabilityScore": 75,
  "seoScore": 65,
  "keywordDensity": 2.5,
  "suggestedKeywords": [
    {
      "term": "example keyword",
      "volume": "1K-10K",
      "difficulty": "Medium",
      "inserted": false
    }
  ],
  "optimizationTips": [
    {
      "type": "warning",
      "title": "Keyword Density",
      "description": "Consider adding more relevant keywords"
    }
  ]
}
```

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utility functions
├── server/                 # Backend Express application
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API route definitions
│   ├── storage.ts         # Data storage interface
│   └── vite.ts            # Vite development setup
├── shared/                 # Shared TypeScript types
│   └── schema.ts          # Data models and validation
└── package.json           # Project dependencies
```

## Configuration

### Environment Variables
The application uses environment variables for configuration. Create a `.env` file in the root directory:

```env
NODE_ENV=development
PORT=5000
```

### Customization

#### Colors and Theming
Modify `client/src/index.css` to customize the color scheme:

```css
:root {
  --primary: 216 100% 50%;        /* Google Blue #4285F4 */
  --secondary: 142 71% 45%;       /* Success Green #34A853 */
  --background: 210 11% 98%;      /* Light Gray #FAFAFA */
}
```

#### SEO Algorithm Tuning
Adjust scoring algorithms in `server/routes.ts`:

```typescript
// Modify scoring weights
const readabilityWeight = 0.4;
const keywordWeight = 0.3;
const structureWeight = 0.3;
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, questions, or feature requests, please open an issue in the repository or contact the development team.

## Acknowledgments

- Built with modern web technologies for optimal performance
- Designed with content creators and SEO professionals in mind
- Powered by advanced natural language processing algorithms
