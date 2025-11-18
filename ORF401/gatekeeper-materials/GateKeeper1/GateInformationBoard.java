import java.awt.*;
import java.io.*;
import java.net.*;
import java.util.*;


/**
 * A frame that contains gate information (for Lab 5 of CIV401)
 */
public class GateInformationBoard extends DisposableFrame
{
    GateListener  listener;
    Hashtable     db;
    int           oport, iport;
    String        host, machine;
    TextArea      info;



    /**
     * Construct a new GateInformationBoard
     */
    public GateInformationBoard(String host,    int registrarport, 
                                String machine, int    receivingport, 
                                Logo logo
								)
    {

	super("Gate Information");
	this.host = host;
	oport = registrarport;

	this.machine = machine;
	iport = receivingport;


	setLayout(new BorderLayout());
	add("North", logo);

	info = new TextArea();
	info.setEditable(false);
	add("Center", info);

	db = new Hashtable();

	setSize(300,400);

	setFont(new Font("Helvetica",Font.BOLD,20));
    }







    /**
     * Add gate information to the board
     */
    public void display(String flight, String gate)
    {
	Enumeration  flights;
	String       key, text, value;

	db.put(flight, gate);  // Will replace if this is a duplicate
	flights = db.keys();


	text = "Flight\tGate\n";
	while (flights.hasMoreElements()) {

	    key = (String)(flights.nextElement());
	    value = (String)(db.get(key));

	    text += key +"\t"+value+"\n";
	}

	info.setText(text);
    }





    /**
     * Send a registration command and check the reply
     */
    private boolean sendRegistrationCommand(String command, String okreply)
    {
	boolean           ok;
	DataInputStream   in;
	PrintStream       out;
	Socket            rs;
	String            reply;



	ok = false;

	try {

	    rs = new Socket(host, oport);

	    try {

		out = new PrintStream(rs.getOutputStream(), true);
		in  = new DataInputStream(rs.getInputStream());

		out.println(command+" "+machine+" "+iport);
		reply = in.readLine();

		if (reply.indexOf(okreply) >= 0) {

		    ok = true;

		} else {

		    ok = false;
		}

		out.close();
		in.close();

	    } catch (IOException ioef) {

		// Problem with the I/O so close the Socket
		ok = false;
		try {rs.close();} catch (IOException ioe) { };
	    }

	} catch (IOException ioes) {

	    // Couldn't open the Socket
	    ok = false;

	}

	return ok;
    }




    /**
     * Shutdown the GateInformationBoard
     */
    public void shutdown()
    {
	boolean ok;


	ok = sendRegistrationCommand("DROP","BYE");

	if (!ok) {

	    System.err.println("Unable to drop from "+host+
                               " on port "+oport);
	    System.exit(0);
	}

    }





    /**
     * Start the GateInformationBoard
     */
    public void startup()
    {
	boolean ok;

	// Create a new GateListener

	listener = new GateListener(iport, this);
	listener.start();


	// Register with the airline


	ok = sendRegistrationCommand("ADD","HELLO");
	if (!ok) {

	    System.err.println("Unable to register with "+host+
                               " on port "+oport);
	    System.exit(0);
	}


	// Show the GateInformationBoard

	show();
    }






}
