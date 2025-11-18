import java.io.*;
import java.net.*;

/**
 * The Java application for Lab 5 of CIV401
 */
public class GateKeeper
{


    public static void main(String[] args)
    {	System.out.println("Starting GateKeeper...\n");		
	GateInformationBoard  cboard, vboard;
	int                   ciport, coport, viport, voport;
//	Logo                  clogo, vlogo;
	String                chost, machine, vhost;



	System.out.println("Starting GateKeeper...\n");

	machine = "civ-101098a.princeton.edu";

	chost = "caladbolg.princeton.edu";
	coport = 8189;  // Port to connect to when registering
	ciport = 8190;  // Port to receive message on
//	clogo = new Logo("carmonair.gif");


/*	vhost = "balmung.princeton.edu";
	voport = 8189;  // Port to connect to when registering
	viport = 8191;  // Port to receive message on
	vlogo = new Logo("vanderfly.gif");
*/

	// Start a GateInformationBoard for vanderFLY and carmonAir

       	cboard = new GateInformationBoard(chost,   coport, 
                                          machine, ciport//										  , clogo											);
	cboard.startup();



//	vboard = new GateInformationBoard(vhost,   voport, machine, viport, vlogo);
//	vboard.startup();


    }



}
