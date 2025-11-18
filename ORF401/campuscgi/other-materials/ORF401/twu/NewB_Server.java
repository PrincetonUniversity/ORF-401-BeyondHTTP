import java.io.*;
import java.net.*;
import java.util.*;//import com.ms.wfc.*;
public class NewB_Server
{
	public static void main(String[] args)
	{ 	  	  B_Database mdb = new B_Database();
	  mdb.readDatabase("Business.dat");
	  boolean isNotExist;	  String user="";

	 	  
	  DataInputStream dis;
	  
	  String line, name, nvPair, query, symbol, value;
	  StringTokenizer st1, st2;
	  query = args[0];
	  	  
	  B_Record mr = new B_Record();
	  
	  // To find name-value pairs	  
	  st1 = new StringTokenizer(query, "&");
	  while (st1.hasMoreTokens()) {
		  nvPair = st1.nextToken();
		  // To split name-value pairs
		  st2 = new StringTokenizer(nvPair, "=");
		  name = st2.nextToken();		  if (st2.hasMoreTokens())
		  {value = URLDecoder.decode(st2.nextToken());}		  else		  {value = "NONE";}
		  		  if ( name.toLowerCase().equals("busername") ) {
			  mr.setBusername (value);			  user = value;
		  } 
		  else if ( name.toLowerCase().equals("bpassword") ) {
			  mr.setBpassword (value);
		  }
		  else if ( name.toLowerCase().equals("brepassword") ) {
			  mr.setBpassword (value);
		  }
		  else if ( name.toLowerCase().equals("bname") ) {
			  mr.setBname (value);
		  }
		  else if ( name.toLowerCase().equals("baddress") ) {
			  mr.setBaddress (value);
		  }
		  else if ( name.toLowerCase().equals("bemail") ) {
			  mr.setBemail (value);
		  } 
		  else {
			  System.err.println("Error in the query string");
			  System.exit(1);
		  }
	  }
	  isNotExist = mdb.addMember (mr);
	  
	  System.out.println("<HTML>");
	  System.out.println("<BODY>");
	  	  if (isNotExist) 
	  { mdb.writeDatabase("Business.dat");
		System.out.println("Welcome to the Net Coupon! As a <B>new business</B>, ");
		String myURL="http://campuscgi.princeton.edu/~rwarnold/coupons/newcoupon.html";
		String myAnchor="<A HREF= \" "+myURL+" \">Click here</A>";
		System.out.println("Please " + myAnchor +" to post your coupon.");	  System.out.println("<script>");
	  System.out.println(" document.cookie=\"username="+user+" ;\" ");	  System.out.println(" document.location = \""+ myURL+"\";");	  
	  System.out.println("</script>");	  }
	  else
	  {	System.out.println("The username has already been used, please ");
		String myURL="http://campuscgi.princeton.edu/~twu/ORF401/BRegister.html";
		System.out.println("<A HREF= \" "+myURL+" \"> choose another username.</A>");		System.out.println("Or click BACK on your browser.");
	  }	  
//System.out.println("<HR> <BR> Cookie information: <SCRIPT>");
//System.out.println("document.writeln([document.cookie]=["+document.cookie+"]");
//System.out.println("</SCRIPT>");

	  System.out.println("</BODY>");
	  System.out.println("</HTML>");
	}
}
