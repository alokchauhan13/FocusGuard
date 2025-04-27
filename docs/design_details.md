# FocusGuard a Google chrome Addon
It is a google chrome addon which takes user inputs about which kind of activities user is planning to do. Addon  monitor which page user is visiting and relates with user activity description. If addon finds user is visiting a page which is not related it provides warning on the page and help user to be focused on his work.

Details are provided below about user inputs and how addon should execute.

## Addon User inputs
When User clicks on add on it should allow user to take following inputs:
1. Addon uses Google Gemini flash. User should provide API key as input. Once API key is provided, mask that input and only last four characters should be visible.
2. Addon should provide two input fields to add two user activity descriptions within 200 words each.
3. Addon should provide a Button named "Guard" to activate monitoring. Once addon is activated , Button mush change to "Stop Guarding", so that when user clicks on "Stop Guarding" button , addon monitoring should stop.
4. When addon is monitoring, input fields must be readonly.
5. Addon should also take input as number of minutes or hours, it should monitor.

## Addon branding
1. Addon should use image present in images/focus-guard-colored.jpeg
2. Addon tag line is "FocusGuard - Your Ally in Focused Work"

## Addon output
Addon shall display category of web site like: 
    1. E-commerce
    2. News
    3. Social Media
    4. Educational
    5. Entertainment
    6. Health and Fitness
    7. Finance and Investment
    8. Travel and Tourism
    9. Technology and Gadgets
    10. Lifestyle and Fashion
    11. Food and Recipes
    12. Automotive
    13. Real Estate
    14. Gaming
    15. Music and Arts
    16. Bank
    17. Learning platforms
    18. College or University
    19. Others

These evaluated category text should be highlighted in Red or Green color based on addon evaluation on user provided activity description and web site details.

## Addon execution step details
Following instructions addon should follow to determine if user is visiting related pages to given user descriptions:

1. Addon must use google Gemini Flash 2.0. Here is the API Key: "".
2. When user visit a page, it should perform following steps:
    - Use the page title and web site link and send to the Google gemini to determine the category of website. If it is a bank, finance and investment or educational, learning platforms, college or university website do not proceed to next step.
    - If user is visiting youtube, it should see the title and comments of selected video and send for review to Gemini
    - Addon should read major page content, and send it to Google gemini to determine if page content have any relation with activity which user is doing.
3. Whenever Addon is communicating with Gemini, it should ask for category of content. It should display category of content as text within Addon.
4. Addon should wait for at-least 1 minute before starting any evaluation. After one minute, page  should be sent for evaluation for its category and relevance to user activity. Once evaluated addon should not revaluate again.
4. If website contents are related to user given activity description, addon should highlight category text in green. 
5. If website contents are not related to user given activity description, addon should highlight category text in red. 

