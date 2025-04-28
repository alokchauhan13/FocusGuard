# FocusGuard a Google chrome Addon
It is a google chrome addon which takes user inputs about which kind of activities user is planning to do. Addon  monitor which page user is visiting and relates with user activity description. If addon finds user is visiting a page which is not related it provides warning on the page and help user to be focused on his work.

Details are provided below about user inputs and how addon should execute.

## Addon User inputs
When User clicks on add on it should allow user to take following inputs:
1. Addon uses GoogleGetAI "gemini-2.0-flash". User should provide API key as input. Once API key is provided, mask that input.
    - Default API key is: "AIzaSyDK-YKOAcFCc4C1b0i2YHGZmaDlhHgeFVU"
2. Addon should provide two input fields to add two user activity descriptions within 120 words each.
3. Addon should provide a Button named "Guard" to activate monitoring. Once addon is activated , Button mush change to "Stop Guarding", so that when user clicks on "Stop Guarding" button , addon monitoring should stop.
4. When addon is monitoring, input fields must be readonly.
5. Addon should also take input as number of minutes or hours, it should monitor.
6. All user provided inputs must be saved in chrome storage and must be read back again when extension is loaded.
7. addon should use already stored input details in storage to evaluate individual website.
8. addon must create a table between website URL and relevance decision and store in storage.
9. Whenever user changes any input old stored table of website url and relevance should be deleted and new entries should be created.

## Addon branding
1. Addon should use image present in images/focus-guard-colored.jpeg
2. Addon tag line is "FocusGuard - Your Ally in Focused Work"

## Addon output
Addon shall display category of web site like: E-commerce, News, Social Media, Educational, Entertainment, Health and Fitness, Finance and Investment, Travel and Tourism, Technology and Gadgets, Lifestyle and Fashion, Food and Recipes, Automotive, Real Estate, Gaming, Music and Arts, Bank, Learning platforms, College or University, Search Engines, Chatbots and AI Assistants, Online Calculators and Converters, Weather Forecast Sites, Maps and Navigation, Forums and Communities, Webmail Services, Project Management Tools, Video Conferencing Platforms, CRM Software Websites, Marketing Automation Platforms, ERP/Business Management Sites, Job Portals, Freelancing Platforms, Legal Services, Event Booking Platforms, Conferences and Webinars, Wikis and Encyclopedias, Review Aggregators, Scientific Research Platforms, API Marketplaces, Software Documentation Sites, Online Marketplaces, B2B Portals, Government Websites, Charity and Fundraising Sites, Dating Websites, Parenting and Kids Sites, Pet Care and Adoption Sites, AI-generated Content Platforms, Blockchain and Crypto Websites, Virtual Reality and Metaverse Platforms

These evaluated category text should be highlighted in Red or Green color based on addon evaluation on user provided activity description and web site details.


## Addon execution step details
Following instructions addon should follow to determine if user is visiting related pages to given user descriptions:

1. Addon must use google Gemini Flash 2.0. Here is the API Key: "".
2. When user visit a page, it should perform following steps:
    - Use the page title and web site link and send to the Google gemini to determine the category of website. If it is a bank, finance and investment or educational, learning platforms, college or university website do not proceed to next step.
    - If user is visiting youtube, it should see the title and comments of selected video and send for review to Gemini
    - Addon should read major page content, and send it to Google gemini to determine if page content have any relation with activity which user is doing.
3. Whenever Addon is communicating with Gemini, it should ask for category of content. It should display category of content as text within Addon.
4. Addon should wait for at-least 30 seconds before starting any evaluation. After one minute, page  should be sent for evaluation for its category and relevance to user activity. Once evaluated addon should not revaluate again.
4. If website contents are related to user given activity description, addon should highlight category text in green. 
5. If website contents are not related to user given activity description, addon should highlight category text in red. 

# Additional design considerations
1. store API key in chrome.storage.local. If key already available chrome.storage.local fill it in input page.
2. Here is the REST API request format to communicate with googleAPis

```REST
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=$YOUR_API_KEY" \
  -H 'Content-Type: application/json' \
  -X POST \
  -d '{
    "contents": [
      {
        "parts": [
          {
            "text": "Explain how AI works in a few words"
          }
        ]
      }
    ]
  }'
```

3. Extension should work in background. Means if user closes the extension popup it should continue to work for currently active selected tab. 
5. Addon should continue to run in Background and evaluate page relevance. 
6. When addon on monitoring inputs should be readonly. 

## Prompt design input

While designing the prompt you should consider that , as a user I am working on given activities. To do these activities I am visiting website. If this content is relevant to my activity please say it is relevant if not please say no. 
website belonging to following categories should always be considered as relevant: Educational, Learning platforms, College or University, Scientific Research Platforms, Wikis and Encyclopedias, Project Management Tools, Software Documentation Sites, AI-generated Content Platforms, Bank, Finance and Investment, Government Websites.

If user is visiting youtube, it should see the title and comments of selected video and send for review to Gemini.
Please see section "Addon output" for list of categories. On console always print prompt input and output.