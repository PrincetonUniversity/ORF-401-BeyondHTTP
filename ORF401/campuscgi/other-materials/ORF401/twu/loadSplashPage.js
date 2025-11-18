function loadSplashPage(splashURL)
{  
   var yesno;
   yesno=extractCookie("splashedGDVD");

   if (yesno=="yes")
   {  }
   else
   {  document.location = splashURL;
   }
}

function extractCookie(name)
{
     var allcookies, end, value, start;


     allcookies = document.cookie;

     start = allcookies.indexOf(name+"=");

     if (start >= 0) {

          start += name.length+1
          end   = allcookies.indexOf(";", start);
          if (end < 0) end = allcookies.length;

          value = allcookies.substring(start,end);
     }

     return value;
}
