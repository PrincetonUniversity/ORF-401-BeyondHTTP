public class RentalsSearchServer
{
  public static void main(String[] args)
  {  RentalsDatabase db = new RentalsDatabase();
     RentalsVector rv = new RentalsVector();
     RentalsRecord rr = new RentalsRecord();
     String theformat = "";
     int i, n;

     theformat=System.getProperty("format");

     db.readDatabase(args[0]);
     rv=db.Search(args[1]);

     n=rv.size();
if (n==0)
{ 
     System.out.println("Sorry! No movie named " + args[1]);
     System.out.println("<P>");
}
else
{ //if format.equals("html")
     System.out.println("<H3>Movies that might interest you:</H3>");

     System.out.println("<TABLE BORDER=1>");

     System.out.print("<TR>");
     System.out.print("<TH>Title");
     System.out.print("<TH>Bar Code");
     System.out.println("<TH>Avalability");

     for (i=0;i<n;i++)
     { rr = rv.elementAt(i);
       System.out.print("<TR>");
       System.out.print("<TD>"+rr.getTitle());
       System.out.print("<TD>"+rr.getCode());
       System.out.println("<TD>"+rr.getAvailable());
     }     

     System.out.println("</TABLE>");
}
     System.out.println("<P>");
     System.out.println("The format is "+theformat+".");
     System.out.println("<P>");

  }
}
