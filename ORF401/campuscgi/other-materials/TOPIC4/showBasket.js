/**
 * Orf401 - Electronic Commerce
 *
 * Simple script for displaying the items in a shopping basket
 */
function showBasket()
{
     var frame, shirt, tie;

     frame = extractCookie("Frame");
     shirt = extractCookie("Shirt");
     tie   = extractCookie("Tie");

     document.writeln("Other items in your shopping basket: ");
     if (frame != null) document.writeln("("+frame+")");
     if (shirt != null) document.writeln("("+shirt+")");
     if (tie != null)   document.writeln("("+tie+")");
}




