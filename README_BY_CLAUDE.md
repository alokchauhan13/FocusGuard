# FocusGuard

A Google Chrome extension that helps you stay focused on your planned activities by monitoring your browsing behavior.

## Overview

FocusGuard allows you to input descriptions of your planned activities and monitors which websites you visit. If you begin browsing unrelated content, the extension provides warnings to help you refocus on your intended tasks.

## Features

- **Activity Tracking**: Input up to two activity descriptions to define your focus areas
- **Smart Monitoring**: Uses Google Gemini Flash 2.0 AI to evaluate webpage relevance
- **Website Categorization**: Automatically identifies website categories
- **Visual Indicators**: Color-coded feedback (green for relevant, red for distracting content)
- **Customizable Duration**: Set your monitoring session for specific time periods
- **Privacy-Focused**: Your API key is partially masked for security

## How It Works

1. Enter your Google Gemini Flash API key
2. Describe up to two activities you're planning to work on
3. Set your monitoring duration
4. Click "Guard" to start monitoring
5. The extension evaluates websites you visit in relation to your planned activities
6. Receive visual feedback about whether content aligns with your goals

## Website Categories

The extension identifies websites across 18 different categories including:
- E-commerce
- Educational
- Entertainment
- Social Media
- Finance and Investment
- Learning platforms
- And more

## Technical Implementation

- Uses Google Gemini Flash 2.0 for content analysis
- Waits 1 minute before initial evaluation to allow for page loading
- Special handling for YouTube content (analyzes video titles and comments)
- Automatic exclusion of important categories (banks, educational platforms, etc.)
- One-time evaluation per page to minimize API usage

## Installation

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer Mode"
4. Click "Load unpacked" and select the extension directory
5. Obtain a Google Gemini Flash API key and enter it in the extension

## License

For license details, please refer to the [LICENSE](./LICENSE) file in the repository.

## Contributors
[Alok Chauhan](https://github.com/alokchauhan13)
