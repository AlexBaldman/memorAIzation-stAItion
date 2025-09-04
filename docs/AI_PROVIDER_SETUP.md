# 🤖 AI Provider Setup Guide

The memorAIzation stAItion uses AI to generate images that enhance memory associations. To use this feature, you'll need to connect to an AI image generation service. This guide will walk you through setting up various providers, with a focus on free and low-cost options.

## How It Works

The application loads AI provider configurations from a file in `config/ai-providers.json`. You will need to provide your own API keys for the services you want to use.

## Recommended Free Providers

We recommend starting with providers that offer a generous free tier.

### 1. Hugging Face (Free Tier)

Hugging Face is a platform that hosts a wide variety of AI models. Many of these can be used for free for inference (i.e., generating images).

**Step 1: Create a Hugging Face Account**
*   Go to [huggingface.co](https://huggingface.co/) and sign up for a free account.

**Step 2: Get Your API Token**
*   Once logged in, navigate to your profile settings by clicking your profile picture in the top right.
*   Go to **"Access Tokens"**.
*   Create a new token with the "Read" role. Copy this token.

**Step 3: Add Your Token to the Application**
*   The application will look for this token in a few places. The recommended way is to set it in the application's UI (if available) or via an environment variable.
*   To set it as an environment variable for local development, create a `.env` file in the root of the project and add the following line:
    ```
    VITE_HF_TOKEN="YOUR_HUGGING_FACE_TOKEN"
    ```
    Replace `"YOUR_HUGGING_FACE_TOKEN"` with the token you copied.

**Available Free Models:**
The default configuration points to `stabilityai/stable-diffusion-2`. Other models may also be available. The Qwen model (`Qwen/Qwen-Image`) is another good option that is often available on the free tier.

### 2. Pollinations

Pollinations is a service that provides image generation without requiring an API key. It's a great fallback option.

*   **Setup:** No setup is required! The `pollinations` provider is configured by default and should work out of the box.
*   **Cost:** Free.
*   **Quality:** Quality can be variable, and it may be slower than other services.

## Paid / Metered Providers

For higher quality or more reliable generation, you may want to use a paid service.

### (Example) Stability AI

*   **Setup:** You would need to get an API key from Stability AI's platform and add it to the configuration.
*   **Cost:** Pay-per-image.
*   **Configuration (Future):** Support for this will be added via the `config/ai-providers.json` file.

## Local AI Generation (Advanced)

For ultimate control and privacy, you can run a model on your own hardware.

*   **Setup:** This is an advanced feature that is not yet fully implemented. It will involve running a local instance of an AI model (like Stable Diffusion via Automatic1111 or ComfyUI) and pointing the application to its local API endpoint.
*   **Cost:** Free (after hardware investment).
*   **Status:** This feature is on our roadmap. See `ROADMAP.md` for details.

---

By following these steps, you can unlock the full power of AI-enhanced memorization in the application.
