import java.net.*;
import java.io.*;
import java.util.*;



/**
 * Reads gate information from a UDP socket (for Lab5 in CIV401)
 */
public class GateListener extends Thread
{
    byte[]                  buffer;
    DatagramPacket          in;
    DatagramSocket          ds;
    GateInformationBoard    board;
    int                     bufferLength;


    /**
     * Construct a new GateListener
     */
    public GateListener(int port, GateInformationBoard gib)
    {
	board = gib;

	try {

	    ds = new DatagramSocket(port);
	    bufferLength = 255;
	    buffer = new byte[bufferLength];


	} catch (IOException ioe) {

	    // Do nothing
	}
    }


    /**
     * Process a message containing gate information
     */
    public void processMessage(String msg)
    {
	String          flight, gate, tok;
	StringTokenizer st;



	st = new StringTokenizer(msg," ");

	try {

	    tok    = st.nextToken();
	    flight = st.nextToken();
	    tok    = st.nextToken();
	    gate   = st.nextToken();
	    board.display(flight, gate);

	} catch (NoSuchElementException nsee) {

	    // Do nothing
	}
    }




    /**
     * Run the GateListener
     */
    public void run()
    {
	String    line;



	while (true) {

	    try {

		in = new DatagramPacket(buffer, buffer.length);
                ds.receive(in);
                line = new String(in.getData(), 0, 0, in.getLength());

                if ( (line != null) && (!line.equals("")) ) {
		    processMessage(line);
                }

		sleep(50);


	    } catch (IOException ioe) {

		// Do nothing

	    } catch (InterruptedException ie) {

		// Do nothing
	    }
	}
    }


}
