import java.io.*;
import java.net.*;

/**
 * ORF401 - Electronic Commerce
 *
 * The Client for A Simple TCP Socket Example
 */
public class LenseBuyer
{

  /**
   * Requires the desired product name to be entered on command line
   * (in quotes if includes spaces); determines local host by
   * invoking InetAddress method.
   */
    public static void main(String[] args)
    {
	String product;
	String client = null;

	product = args[0];

	try {
	  client = InetAddress.getLocalHost().getHostName() ;
	} catch (Exception e) {
	  System.err.println(""+e.toString() );
	}

	checkPrice( client, 8190, product);
    }



    public static void checkPrice(String host, int port, String product)
    {
	DataInputStream   in;
	PrintStream       out;
	Socket            s;
	String            reply;


	try {

	    s = new Socket(host, port);

	    try {

		out = new PrintStream(s.getOutputStream(), true);
		in  = new DataInputStream(s.getInputStream());

		System.out.println("Searching for "+product);
		out.println("SEARCH"+"\t"+product);
		reply = in.readLine();

		if (reply.indexOf("NOT FOUND") < 0) {
                    System.out.println(reply);
		}

		out.close();
		in.close();

	    } catch (IOException ioef) {

		// Problem with the I/O so close the Socket
		try {
		  System.err.println(""+ioef);
		  s.close();

		} catch (IOException ioe) { };
	    }

	} catch (IOException ioes) {

	    // Couldn't open the Socket
	  System.err.println(""+ioes);
	}
    }


}
