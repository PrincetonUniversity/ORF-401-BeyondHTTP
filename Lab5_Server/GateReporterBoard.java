import java.awt.*;
import java.io.*;
import java.net.*;
import java.util.*;


public class GateReporterBoard extends Frame
{
    GateListenerDatabase  listeners;
    TextArea              info;



    /**
     * Construct a new GateReporterBoard
     */
    public GateReporterBoard(GateListenerDatabase listeners)
    {

	super("Registered Listeners");

	this.listeners = listeners;

	setLayout(new BorderLayout());

	info = new TextArea();
	info.setEditable(false);
	add("Center",info);

	resize(300,400);
    }







    /**
     * Add gate information to the board
     */
    public void display()
    {
	Enumeration          e;
	GateListenerRecord   glr;
	String               text;


	e = listeners.getAll();

	text="";
	while (e.hasMoreElements()) {

	    glr = (GateListenerRecord)(e.nextElement());
	    text += glr.host+":"+glr.port+"\n";
	}

	info.setText(text);
    }










}
