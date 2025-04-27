# FocusGuard - A Google Chrome Addon

FocusGuard is a productivity-enhancing Google Chrome addon designed to help users stay focused on their tasks. By monitoring the websites users visit and comparing them with their planned activities, FocusGuard provides real-time feedback to ensure users remain on track.

## Features

### User Inputs
1. **API Key Input**: Users must provide a Google Gemini Flash API key. The input will be masked, showing only the last four characters for security.
2. **Activity Descriptions**: Two input fields allow users to describe their planned activities, each limited to 200 words.
3. **Guard Activation**: A "Guard" button activates monitoring. Once activated, the button changes to "Stop Guarding" to allow users to stop monitoring.
4. **Monitoring Duration**: Users can specify the monitoring duration in minutes or hours.
5. **Readonly Fields**: Input fields become readonly while monitoring is active.

### Output
- **Website Categories**: The addon identifies the category of visited websites, such as:
    - E-commerce
    - News
    - Social Media
    - Educational
    - Entertainment
    - Health and Fitness
    - Finance and Investment
    - Travel and Tourism
    - Technology and Gadgets
    - Lifestyle and Fashion
    - Food and Recipes
    - Automotive
    - Real Estate
    - Gaming
    - Music and Arts
    - Bank
    - Learning Platforms
    - College or University
    - Other

- **Category Highlighting**: Categories are highlighted in green if the content relates to the user's activity description and red if it does not.

## How It Works

1. **Google Gemini Flash Integration**: The addon uses Google Gemini Flash 2.0 to evaluate website content and determine its category.
2. **Content Analysis**:
     - Page titles and links are analyzed to determine the category.
     - For platforms like YouTube, video titles and comments are reviewed.
     - Major page content is sent to Google Gemini for relevance evaluation.
3. **Evaluation Timing**: The addon waits at least one minute before starting evaluations to avoid unnecessary checks.
4. **Visual Feedback**: Content category is highlighted in green, while irrelevant content category is highlighted in red.

## Getting Started

1. Install the FocusGuard addon from the Chrome Web Store.
2. Open the addon and provide your Google Gemini Flash API key.
3. Enter your planned activities and set the monitoring duration.
4. Click "Guard" to start monitoring and stay focused!

## License

This project is licensed under the MIT License. See the LICENSE file for details.
