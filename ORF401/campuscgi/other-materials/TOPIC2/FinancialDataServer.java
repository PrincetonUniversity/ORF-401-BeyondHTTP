import java.io.*;
import java.net.*;
import java.util.*;

/**
 * ORF401 - Electronic Commerce
 *
 * A More Complicated Server Side Processing Example
 */
public class FinancialDataServer
{
    public static final int STOCK  = 0;
    public static final int FUTURE = 1;



    public static void main(String[] args)
    {
        boolean            showClose, showHigh, showLow, showOpen;
        boolean            showOpenInterest, showVolume;
        DataInputStream    dis;
        int                type;
        Security           s;
        String             fn, line, name, nvPair, query, symbol, value;
        StringTokenizer    st1, st2;



        query = args[0];

        showClose = false;
        showHigh = false;
        showLow = false;
        showOpen = false;
        showOpenInterest = false;
        showVolume = false;

        // Default security
        fn = "MSFT.stk";

        // To find name-value pairs
        st1 = new StringTokenizer(query, "&");


        while (st1.hasMoreTokens()) {

            nvPair = st1.nextToken();

            // To split name-value pairs
            st2 = new StringTokenizer(nvPair, "=");

            name = st2.nextToken();
            value = URLDecoder.decode(st2.nextToken());

            if ( name.toLowerCase().equals("symbol") ) {

                fn = value;

            } else if  ( name.toLowerCase().equals("data") ) {

                if ( value.toLowerCase().equals("close") )     showClose = true;
                else if ( value.toLowerCase().equals("high") ) showHigh = true;
                else if ( value.toLowerCase().equals("low") )  showLow = true;
                else if ( value.toLowerCase().equals("open") ) showOpen = true;
                else if ( value.toLowerCase().equals("open interest") ) showOpenInterest = true;
                else if ( value.toLowerCase().equals("volume") ) showVolume = true;

            } else {

                System.err.println("Error in the query string");
                System.exit(1);
            }
        }

        if (fn.indexOf(".stk") >= 0) type = STOCK;
        else                         type = FUTURE;

        symbol = fn.substring(0,fn.indexOf("."));


        // Open Interest is not relevant for stocks
        if (type == STOCK) showOpenInterest = false;


        try {

            dis = new DataInputStream(
                      new BufferedInputStream(
                          new FileInputStream(fn)));


	    System.out.println("<HTML>");
	    System.out.println("<BODY>");
            System.out.println("<TABLE CELLPADDING=\"10\">");

            System.out.println("<TR>");

            System.out.println("<TH>Date</TH>");

            if (showOpen) 
                System.out.println("<TH>Open</TH>");

            if (showHigh) 
                System.out.println("<TH>High</TH>");

            if (showLow) 
                System.out.println("<TH>Low</TH>");

            if (showClose) 
                System.out.println("<TH>Close</TH>");

            if (showVolume) 
                System.out.println("<TH>Volume</TH>");

            if (showOpenInterest) 
                System.out.println("<TH>Open Int.</TH>");

            System.out.println("</TR>");


            while ( (line=dis.readLine()) != null ) {

                if (type == STOCK) s = new Stock(symbol,  line);
                else               s = new Future(symbol, line);

                System.out.println("<TR>");

                System.out.println("<TD>"+s.getDate().getMonth()+"/"
                                         +s.getDate().getDay()+"/"
                                         +s.getDate().getYear()
                                   +"</TD>");

                if (showOpen) 
                    System.out.println("<TD>"+s.getOpen()+"</TD>");

                if (showHigh) 
                    System.out.println("<TD>"+s.getHigh()+"</TD>");

                if (showLow) 
                    System.out.println("<TD>"+s.getLow()+"</TD>");

                if (showClose) 
                    System.out.println("<TD>"+s.getClose()+"</TD>");

                if (showVolume) 
                    System.out.println("<TD>"+s.getVolume()+"</TD>");

                if (showOpenInterest) 
                    System.out.println("<TD>"+((Future)s).getOpenInterest()+"</TD>");

                System.out.println("</TR>");
            }

            System.out.println("</TABLE>");
	    System.out.println("</BODY>");
	    System.out.println("</HTML>");

        } catch (IOException ioe) {

            System.err.println("No such file: "+fn);
            System.exit(1);
        }
    }

}
