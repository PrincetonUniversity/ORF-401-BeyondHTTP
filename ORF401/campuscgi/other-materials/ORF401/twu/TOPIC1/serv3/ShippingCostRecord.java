//ShippingCostRecord.java
import java.util.*;
/**
* CIV401 - Electronic Commerce
*
* A Supporting Class for Part II of the Simple Server Side Pro-cessing
Example
*/
public class ShippingCostRecord
{
private double cost;
private String state;
/**
* Construct a new ShippingCostRecord
*/
public ShippingCostRecord(String line)
{
StringTokenizer st;
String tok;
st = new StringTokenizer(line, "\t");
try {
state = st.nextToken();
tok = st.nextToken();
cost = Double.valueOf(tok).doubleValue();
} catch (NoSuchElementException nsee) {
System.err.println("Missing entry in: "+line);
System.exit(2);
} catch (NumberFormatException nfe) {
System.err.println("Invalid cost in: "+line);
System.exit(2);
}
}
/*
** Return the shipping cost
*/
public double getCost()
{
return cost;
}
/*
** Return the two-character code for the State
*/
public String getState()
{
return state;
}
}

