import java.io.*;
import java.util.*;


/**
 * ORF401 - Electronic Commerce
 *
 * A Supporting Class for Part II of the Simple Server Side Processing Example
 */
public class ShippingCostDatabase
{
    double         defaultCost;
    Hashtable      ht;


    /**
     * Construct a new ShippingCostDatabase
     */
    public ShippingCostDatabase()
    {
	BufferedInputStream      bis;
	DataInputStream          dis;
	FileInputStream          fis;
	ShippingCostRecord       scr;
	String                   key, line;



	defaultCost = 4.95;
	ht = new Hashtable(51);


        try {

	    fis = new FileInputStream("shippingcost.dat");
	    bis = new BufferedInputStream(fis);
            dis = new DataInputStream(bis);

	    while ( (line=dis.readLine()) != null  ) {

		scr = new ShippingCostRecord(line);
		key = scr.getState();
		ht.put(key, scr);
	    }

	} catch(IOException ioe) {

	    System.err.println("IO Error");
            System.exit(1);
	}
    }



    /**
     * Return the cost of shipping to a particular state
     */
    public double getCost(String state)
    {
	double                cost;
	ShippingCostRecord    scr;


	scr = (ShippingCostRecord)(ht.get(state));

	if (scr != null) {

	    cost = scr.getCost();

	} else {

	    cost = defaultCost;
	}

	return cost;
    }

}
