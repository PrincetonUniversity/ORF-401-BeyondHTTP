import java.net.*;
import java.io.*;
import java.util.*;



/**
 * ORF401 - Electronic Commerce
 *
 * A simple UDP socket example
 * (Reads vending machine transactions from a UDP socket)
 * Requires the appropriate port number as input.
 */
public class vmListener
{

    public static void main(String[] args)
    {
	byte[]                  buffer;
	DatagramPacket          in;
	DatagramSocket          ds;
	int                     bufferLength, port;
	String    line;


	port = Integer.valueOf(args[0]).intValue();

	try {

	    ds = new DatagramSocket(port);
	    bufferLength = 255;
	    buffer = new byte[bufferLength];

	    System.out.println("Listening to port "+port+"\n");

	    while (true) {

		try {

		    in = new DatagramPacket(buffer, buffer.length);
		    ds.receive(in);
		    line = new String(in.getData(), 0, 0, in.getLength());

		    if ( (line != null) && (!line.equals("")) ) {
			processMessage(line);
		    }

		} catch (IOException ioe) {

		    // Do nothing
		}
	    }

	} catch (IOException ioe) {

	    // Do nothing
	}
    }



    /**
     * Process a message containing information from a vending machine
     */
    public static void processMessage(String msg)
    {
	String          id, product, transaction;
	StringTokenizer st;


	st = new StringTokenizer(msg,"\t");

	try {

	    id          = st.nextToken();
	    product     = st.nextToken();
	    transaction = st.nextToken();

	    System.out.println(id+"\t"+product+"\t"+transaction);

	} catch (NoSuchElementException nsee) {

	    // Do nothing
	}
    }



}
