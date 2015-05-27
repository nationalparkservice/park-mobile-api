# places-mobile-media-service
A service that will resize images based on requirements

# How to add a new park
1. Add the new Park to the "places_mobile_parks" table
2. Add the new Park to the "places_mobile_urls" table
3. Generate the initial app.json (just to make sure everything works) http://10.147.153.192:3000/api/generate/json/UNITCODE
4. Post Images through this URL http://10.147.153.192:3000/api/image
5. Add sites directly to CartoDB only
6. After you add sites, remember to generate thumbnails for those sites http://10.147.153.192:3000/api/generate/thumbnails/UNITCODE/SITEID
   You can also regenerate all thumbnails using the URL http://10.147.153.192:3000/api/generate/thumbnails/UNITCODE/all
