import java.applet.*;
import java.awt.*;
import java.io.*;
import java.net.*;

/**
 * CIV401 - Electronic Commerce
 *
 * Extending the Browser with a  Simple Applet
 */


public class Chart extends Applet
{
    double    max, min;
    Stock[]  history;
    int       days;




    /**
     * Initialize the Chart Applet
     */
    public void init()
    {
	DataInputStream    dis;
	int                i;
	String             line;
	URL                u;



	history = new Stock[365];
	i = 0;
	line = "";
	max = Double.NEGATIVE_INFINITY;
	min = Double.POSITIVE_INFINITY;


	try {

	    u = new URL("http://campuscgi.princeton.edu/~civ401/TOPIC5/"+
                        "AustralianDollarServer.cgi");

	    dis = new DataInputStream(u.openStream());

	    /*
	    dis = new DataInputStream(new BufferedInputStream(new FileInputStream("AD97Z.fut")));
	    */

	    while ( (line=dis.readLine()) != null ) {

		history[i] = new Stock("AD97Z", line);

		if (history[i].getLow()  < min) min = history[i].getLow();
		if (history[i].getHigh() > max) max = history[i].getHigh();

		i++;
	    }

	    days = i;


	} catch (MalformedURLException mue) {

	    // Do nothing
	    System.err.println(mue);

	} catch (IOException ioe) {

	    // Do nothing
	    System.err.println(ioe);
	}
    }




    /**
     * Render the Chart Applet
     */
    public void paint(Graphics g)
    {
	Dimension   d;
	double      height, scale, width;
	int         close, high, i, low, open, over;



	super.paint(g);
	if (days == 0) return;

	d = size();
	height = (double)(d.height);
	width  = (double)(d.width);

	scale = height/(max - min);
	

	for (i=0; i<days; i++) {

	    over = (i+1)*4;
	    high   = (int)((max - history[i].getHigh())*scale);
	    low    = (int)((max - history[i].getLow())*scale);
	    open   = (int)((max - history[i].getOpen())*scale);
	    close  = (int)((max - history[i].getClose())*scale);


	    g.drawLine(over,high,over,low);
	    g.drawLine(over-1,open,over,open);
	    g.drawLine(over+1,close,over,close);
	}

    }



}
