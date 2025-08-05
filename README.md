This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app), enhanced with [Daytona AI SDK](https://www.daytona.io/) integration.

## Daytona AI Integration

This project integrates the Daytona AI SDK to provide cloud sandbox capabilities directly in the browser. Users can:

- Create sandboxes for different programming languages (TypeScript, Python, Node.js)
- Execute commands in real-time within the sandboxes
- View command outputs and errors
- Manage sandbox lifecycle

### Configuration

1. Copy your Daytona API key to the `.env.local` file:
```bash
DAYTONA_API_KEY=your-api-key-here
DAYTONA_API_URL=https://app.daytona.io/api
DAYTONA_TARGET=us
```

2. The implementation uses Next.js API routes to bridge between the browser and the Daytona SDK, avoiding Node.js compatibility issues in the browser.

### Architecture

- **Frontend**: React components with TypeScript
- **API Routes**: `/api/sandbox/create` and `/api/sandbox/execute`
- **Services**: Client-side service layer for API communication
- **SDK Integration**: Server-side Daytona SDK usage

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
