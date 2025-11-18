//ShippingCostDatabase.java Version 1
/**
* CIV401 - Electronic Commerce
*
* A Supporting Class for Part II of the Simple Server Side Pro-cessing
Example
*/
public class ShippingCostDatabase
{
/**
* Return the cost of shipping to a particular state
*/
public double getCost(String state)
{
double cost;
if (state.equals("CA")) cost = 8.95;
else if (state.equals("CT")) cost = 6.95;
else if (state.equals("FL")) cost = 7.95;
else if (state.equals("NJ")) cost = 1.95;
else if (state.equals("NY")) cost = 9.95;
else if (state.equals("PA")) cost = 7.50;
else cost = 4.95;
return cost;
}
}

