/**
 * Orf401 - Electronic Commerce
 *
 * A Simple Server Side Processing Example
 */
public class ShippingCostServer1
{
     public static void main(String[] args)
     {
	 double          cost;
         String          state;


	 // For simplicity, don't fo any error checking

	 state = args[0];

	 if      (state.equals("CA")) cost = 8.95;
	 else if (state.equals("CT")) cost = 6.95;
	 else if (state.equals("FL")) cost = 7.95;
	 else if (state.equals("NJ")) cost = 1.95;
	 else if (state.equals("NY")) cost = 9.95;
	 else if (state.equals("PA")) cost = 8.50;
	 else                         cost = 4.95;


	 System.out.println("<HTML>");
	 System.out.println("<BODY>");
	 System.out.println("The shipping cost to "+state+" is $"+cost);
	 System.out.println("</BODY>");
	 System.out.println("</HTML>");

     }

}
