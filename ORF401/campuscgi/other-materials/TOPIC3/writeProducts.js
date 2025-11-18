/**
 * ORF401 - Electronic Commerce - Supporting Script for Part IV of the
 *                                Server Side Processing Example
 */
function writeProducts()
{
    var n;

    for (n in price) {

        document.writeln(
           "<TR>"+
           "<TD>"+
           n+
           "</TD>"+
           "<TD>"+
           "<INPUT TYPE=\"text\" NAME=\"q"+n+"\" SIZE=\"5\" onChange=\"subtotal('"+n+"');\">"+
          "</TD>"+
          "<TD>"+
          "@ "+price[n]+
          "</TD>"+
          "<TD BGCOLOR=\"GRAY\">"+
          "<INPUT TYPE=\"text\" NAME=\"t"+n+"\" SIZE=\"5\">"+
          "</TD>"+
          "</TR>"
          );
    }
}
