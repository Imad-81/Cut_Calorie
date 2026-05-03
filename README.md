# 🥗 Cut AI - Intelligent Nutrition & Calorie Tracking

Cut AI is a modern, AI-powered nutrition tracking application designed to simplify the way you monitor your dietary habits. By leveraging state-of-the-art vision models, Cut AI allows users to log their meals simply by taking a photo or providing a brief description.

![Cut AI Banner](public/icon.png)

## ✨ Features

- **📸 AI-Powered Food Logging**: Instantly analyze food images using Groq's Llama 3.2 Vision model to get accurate estimates of calories, protein, carbs, and fats.
- **📝 Smart Descriptions**: Don't have a photo? Just describe what you ate, and our AI will handle the rest.
- **📊 Dynamic Dashboards**: Visualize your daily progress against personalized targets with beautiful, interactive charts.
- **⚖️ Weight Tracking**: Monitor your weight trends over time and see how they correlate with your caloric intake.
- **🎯 Personalized Goals**: Set targets based on your height, weight, age, activity level, and primary objective (Fat Loss, Maintenance, or Muscle Gain).
- **📱 Mobile Optimized**: Built with a responsive design for a seamless experience on any device.
- **🔄 Image Preprocessing**: Robust handling of various image formats, including HEIC (iPhone), with automatic resizing and normalization for optimal AI analysis.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Backend**: [Convex](https://www.convex.dev/) (Real-time Database & Serverless Functions)
- **Authentication**: [Clerk](https://clerk.com/)
- **AI Engine**: [Groq](https://groq.com/) (Llama 3.2-11B Vision & Llama 3.3-70B)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Charts**: [Recharts](https://recharts.org/)
- **Image Processing**: `heic-convert`, `jimp`, `browser-image-compression`

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ 
- A [Convex](https://www.convex.dev/) account
- A [Clerk](https://clerk.com/) account
- A [Groq API Key](https://console.groq.com/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/cut_ai.git
   cd cut_ai
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file in the root directory and add the following:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_pub_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   NEXT_PUBLIC_CONVEX_URL=your_convex_url
   GROQ_API_KEY=your_groq_api_key
   ```

4. **Run the development server:**
   ```bash
   # Start Convex in one terminal
   npx convex dev

   # Start Next.js in another terminal
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)** in your browser.

## 📂 Project Structure

- `app/`: Next.js routes, pages, and layouts.
- `convex/`: Backend schema, queries, mutations, and AI actions.
- `components/`: Reusable UI components.
- `lib/`: Shared utility functions and image processing logic.
- `public/`: Static assets and icons.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
