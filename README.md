# Figma AI Assistant

This project implements an AI agent that utilizes Retrieval-Augmented Generation (RAG) to access the full documentation of Figma. The agent can efficiently retrieve and provide information from the documentation based on user queries. It also uses web scraping to get the latest information from the documentation.

Other features include the ability to generate user interface componens with full CSS and HTML code and to search for images on Pexels.

## Overview

The AI agent is designed to read and process the Figma Design documentation, allowing users to ask questions and receive accurate responses based on the official documentation. The project leverages embeddings to enhance the retrieval process, ensuring that the agent can quickly access relevant information.

The AI agent also have access to tools to generate user interface componens with full CSS and HTML code and to search for images on Pexels.

## Features

- **RAG Implementation**: Combines retrieval and generation techniques to provide accurate responses.
- **Embeddings**: Each URL from the Figma Design documentation is stored as a resource in the database, with corresponding embeddings for efficient retrieval.
- **Multimodal**: The agent is capable to interpret images on the documentation and provide relevant images and gifs on the response.
- **API Endpoint**: A GET endpoint that reads `urls.md`, which contains all URLs for the Figma Design documentation.
- **Web Scraping**: The webscrapping API is available at `http://localhost:3000/api/figma`.
- **Component Generation**: The agent can generate user interface componens with full CSS and HTML code.
- **Image Search**: The agent can search for images on Pexels.

## Getting Started

### Prerequisites

- Node.js (version >= v18.17.0)
- npm or yarn
- A database (e.g., PostgreSQL) for storing resources and embeddings
- A Firecrawl API key (<a href="https://www.firecrawl.dev/" target="_blank">https://www.firecrawl.dev/</a>)
- A OpenAI API key (<a href="https://openai.com/index/openai-api/" target="_blank">https://openai.com/index/openai-api/</a>)
- A Google Generative AI API key (<a href="https://cloud.google.com/ai/generative-ai" target="_blank">https://cloud.google.com/ai/generative-ai</a>)
- A Pexels API key (<a href="https://www.pexels.com/api/documentation/" target="_blank">https://www.pexels.com/api/documentation/</a>)
- A Claude API key (<a href="https://console.anthropic.com/settings/keys" target="_blank">https://console.anthropic.com/settings/keys</a>)

### Environment Variables

To run the application, you need to create a `.env` file in the root directory of the project with the following environment variables:

```plaintext
DATABASE_URL=<your_postgresql_database_url>
OPENAI_API_KEY=<your_openai_api_key>
FIRECRAWL_API_KEY=<your_firecrawl_api_key>
GOOGLE_GENERATIVE_AI_API_KEY=<your_google_generative_ai_api_key>
PEXELS_API_KEY=<your_pexels_api_key>
ANTHROPIC_API_KEY=<your_claude_api_key>
```

- **`DATABASE_URL`**: The connection string for your PostgreSQL database.
- **`OPENAI_API_KEY`**: Your API key for accessing OpenAI services for chat and embeddings.
- **`FIRECRAWL_API_KEY`**: The API key for the Firecrawl service used for web scraping.
- **`GOOGLE_GENERATIVE_AI_API_KEY`**: The API key for the Google Generative AI service used for image description.
- **`PEXELS_API_KEY`**: The API key for the Pexels service used for image search.
- **`ANTHROPIC_API_KEY`**: The API key for the Claude service used for image description.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Saraceni/FigmaAiAgent.git
   cd your-repo-name
   ```

2. Install dependencies:
   ```bash
   pnpm install
   # or
   yarn install
   ```

3. Set up your database and configure the connection settings in your environment variables.

### Usage

1. **Run the Application**:
   ```bash
   pnpm run dev
   # or
   yarn dev
   ```

2. **Access the web scraping API**:
   - The web scraping API is available at `http://localhost:3000/api/figma`.
   - **First run**: The GET endpoint reads `urls.md`, extracts text content from each page, and creates text embeddings for each resource in the database.
   - **Second run**: The GET endpoint processes all images from previously scraped pages, creates descriptions for them using Google's Generative AI, and stores these as media resources in the database.
   
### API Endpoint

- **GET /api/figma**
  - **First execution**: 
    - Reads `urls.md`, which contains all URLs for the Figma Design documentation.
    - Extracts text content from each page.
    - Creates text embeddings for each resource in the database.
  - **Second execution**:
    - Processes all images from previously scraped pages.
    - Generates descriptions for each image using Google's Generative AI.
    - Stores these image descriptions as media resources in the database.
  - The endpoint automatically detects whether it's the first or second run based on existing database records.

### Database Schema

Each resource in the database represents a URL from the Figma Design documentation. The schema includes:

- **Resource ID**: Unique identifier for each resource.
- **URL**: The URL of the Figma Design documentation.
- **Embeddings**: Vector representations of the resource for efficient retrieval.
- **Media**: Descriptions of images scraped from the documentation.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Figma](https://figma.com/) for their excellent documentation.
- [OpenAI](https://openai.com/) for the assistant.
- [Claude](https://anthropic.com/) for the code generation.
- [Pexels](https://pexels.com/) for the images.


# This project was bootsrapped with the Vercel AI SDK RAG Guide Starter Project

This is the starter project for the Vercel AI SDK [Retrieval-Augmented Generation (RAG) guide](https://sdk.vercel.ai/docs/guides/rag-chatbot).

In this project, you will build a chatbot that will only respond with information that it has within its knowledge base. The chatbot will be able to both store and retrieve information. This project has many interesting use cases from customer support through to building your own second brain!

This project will use the following stack:

- [Next.js](https://nextjs.org) 14 (App Router)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [OpenAI](https://openai.com)
- [Drizzle ORM](https://orm.drizzle.team)
- [Postgres](https://www.postgresql.org/) with [ pgvector ](https://github.com/pgvector/pgvector)
- [shadcn-ui](https://ui.shadcn.com) and [TailwindCSS](https://tailwindcss.com) for styling
