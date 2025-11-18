//ShippingCostServer2.java
/**
* CIV401 - Electronic Commerce
*
* A Simple Server Side Processing Example - Part II
*/
public class ShippingCostServer2
{
public static void main(String[] args)
{
double cost;
ShippingCostDatabase db;
String state;
// For simplicity, don’t fo any error checking
state = args[0];
db = new ShippingCostDatabase();
cost = db.getCost(state);
System.out.println("<HTML>");
System.out.println("<BODY>");
System.out.println("The shipping cost to "+state+" is $"+cost);
System.out.println("</BODY>");
System.out.println("</HTML>");
}
}

