
/**
 * Searches through movie titles for matching
 * substring provided in simple ISINDEX query string
 *
 * @author  Kelley Scott & Alain Kornhauser Feb 2005
 */
public class RentalsSearchServer
{

  /**
   * Construct a "server" to search movie titles in
   * the given database.
   *
   * Opens a <code>RentalsDatabase</code>, then searches
   * for a substring among the titles.
   *
   * Prints results in web page or plain text format
   * as indicated by a format command line argument.
   */
  public static void main(String[] args) {

    String format;
    //String name;
    //String searchstring;

    RentalsDatabase rdb = new RentalsDatabase();

    //Get the print format
    format = System.getProperty("format");
    if (format == null) format="text/plain";

    //Read the database
    rdb.readDatabase( args[0] );

    //Search the database for titles containing searchstring
    RentalsVector rv = rdb.Search( args[1] );

    //Display results
    if (  format.equals("html") )
      printHtml(rv);
    else
      printText(rv);

  }

  /**
   * Prints search results in <code>HTML</code> format.
   *
   * @param v  results stored in <code>RentalsVector</code>
   */
  static void printHtml(RentalsVector v) {

    int num = v.size();
    if (num > 0) {
      System.out.println("<H3>How about?</H3>");
      System.out.println("<CENTER>" +
			 "<TABLE BGCOLOR=PINK BORDER=2 CELLSPACING=3 CELLPADDING=5 WIDTH=75%>");

      System.out.println("<TR BGCOLOR=white>");
      System.out.print("<TH>Title</TH> ");
      System.out.println("<TH>Code</TH>");
      System.out.println("</TR>");

      for (int i=0;i<v.size();i++) {
	RentalsRecord rr = (RentalsRecord)v.elementAt(i);

	System.out.println("<TR>");
	System.out.print("<TD ALIGN=CENTER>"+rr.getTitle()+"</TD> ");
	System.out.println("<TD>"+rr.getCode()+"</TD>");
	System.out.println("</TR>");
      }
      System.out.println("</TABLE></CENTER>");
      System.out.println("<H3>Thanks for using <EM>The Great DVD</EM>!</H3></P>");
    } else
      System.out.println("<H3>No related title found.  " +
                         "Search again?</H3>");
  }

  /**
   * Prints out search results using plain text.
   *
   * @param v  results stored in <code>RentalsVector</code>
   */
  static void printText(RentalsVector v) {
    int num = v.size();
    if (num > 0) {
      for (int i=0;i<v.size();i++) {
	RentalsRecord rr = (RentalsRecord)v.elementAt(i);

	System.out.print(""+rr.getTitle()+" ");
	System.out.println(""+rr.getCode());
      }
    } else
      System.out.println("No related title found." +
			 " Search again?");

  }


}
