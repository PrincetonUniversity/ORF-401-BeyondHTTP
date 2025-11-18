import java.util.*;

/**
 * ORF401 - Electronic Commerce
 *
 * A Supporting Class for a More Complicated Server Side Processing Example
 */
public abstract class Security
{

    protected Date             date;
    protected double           close, high, low, open;
    protected int              vol;
    protected String           symbol;
    protected StringTokenizer  st;





    /**
     * Return the closing price
     */
    public double getClose()
    {
	return close;
    }


    /**
     * Return the date
     */
    public Date getDate()
    {
	return date;
    }


    /**
     * Return the high price
     */
    public double getHigh()
    {
	return high;
    }


    /**
     * Return the low price
     */
    public double getLow()
    {
	return low;
    }


    /**
     * Return the opening price
     */
    public double getOpen()
    {
	return open;
    }

    /**
     * Return the symbol for this security
     */
    public String getSymbol()
    {
	return symbol;
    }


    /**
     * Return the volume
     */
    public int getVolume()
    {
	return vol;
    }




    /**
     * Parse for the common elements of all securities 
     * (i.e, the open, high, low, close, and volume)
     */
    protected void parseCommon()
    {
	String tok;

	try {

	    tok = st.nextToken();
	    open = Double.valueOf(tok).doubleValue();

	    tok = st.nextToken();
	    high = Double.valueOf(tok).doubleValue();

	    tok = st.nextToken();
	    low = Double.valueOf(tok).doubleValue();

	    tok = st.nextToken();
	    close = Double.valueOf(tok).doubleValue();

	    tok = st.nextToken();
	    vol = Integer.valueOf(tok).intValue();


	} catch (NoSuchElementException nsee) {

	    System.err.println("Missing entry");
	    System.exit(2);

	} catch (NumberFormatException nfe) {

	    System.err.println("Invalid entry");
	    System.exit(2);
	}
    }




    /**
     * Parse for the date
     */
    protected void parseDate()
    {
	int         dd, mm, yy;
	String      dds, mms, tok, yys;


	tok = st.nextToken();

	yys = tok.substring(0,2);
	yy  = Integer.valueOf(yys).intValue();

	mms = tok.substring(2,4);
	mm  = Integer.valueOf(mms).intValue();

	dds = tok.substring(4);
	dd  = Integer.valueOf(dds).intValue();

	date = new Date(yy,mm,dd);
    }



}
