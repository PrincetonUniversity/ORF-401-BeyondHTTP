import java.io.*;
import java.util.*;
import java.net.*;
import java.awt.*;
import java.awt.event.*;

public class GateInformationBoard extends DisposableFrame{

 private String myIP; 
 private String serverIP;
 private int portTCP;
 private int portUDP;
 public TextArea info;
 public GateListener glistener;
 public String infoHeader = "Destination        Av. Seats    Gate\n";
 
 public GateInformationBoard(String myaddress, String serveraddress, int TCP_port,  int UDP_port, Logo logo) {
  
  super("Gate Information");  //use father class's constructor
  myIP = myaddress;
  serverIP = serveraddress;
  
  portTCP = TCP_port;
  portUDP = UDP_port;

  setLayout(new BorderLayout());
  add("North", logo);

  info = new TextArea();
  info.setEditable(false);
  add("Center", info);

  setSize(300,400);
 }
 
 public void Register(){
   DataInputStream   in; 
   PrintStream       out; 
   Socket            socket; 
   String            reply;
   
   try { 
       socket = new Socket(serverIP, portTCP); 
       try { 
           out = new PrintStream(socket.getOutputStream(), true); 
           in  = new DataInputStream(socket.getInputStream()); 
           out.println("ADD"+" "+ myIP +" "+ portUDP);   
           reply = in.readLine(); 
           System.out.println(reply);
           //if (reply.indexOf("HELLO") < 0) {  
           //   System.out.println(reply); }
              out.close(); 
              in.close(); 
           }
       catch (IOException ioef) { 
           // Problem with the I/O so close the Socket 
           try { 
               System.err.println(""+ioef); 
               socket.close(); 
          } catch (IOException ioe) { }; 
       }
   }catch (IOException ioes) { 
      // Couldn't open the Socket 
      System.err.println(""+ioes); 
   }
 }

 // creates a new GateListener GateListener(portUDP, this)
 // and registers with the ride sharing company at serverIP on portTCP
  public void StartUp(){
      Register();
      glistener = new GateListener(portUDP, this);
      glistener.start();
      setVisible(true);
  }

  public void shutdown(){  // click "x" will automatically run this function
    DataInputStream   in; 
    PrintStream       out; 
    Socket            socket; 
    String            reply;
    
    try { 
       socket = new Socket(serverIP, portTCP);  
       try { 
         out = new PrintStream(socket.getOutputStream(), true); 
         in  = new DataInputStream(socket.getInputStream()); 
         out.println("DROP"+" "+myIP +" "+ portUDP);  
         reply = in.readLine(); 
         System.out.println(reply); 
         //if (reply.indexOf("BYE") < 0) {  
         //    System.out.println(reply); }
             out.close(); 
             in.close(); 
          }
       catch (IOException ioef) { 
          // Problem with the I/O so close the Socket 
          try { 
            System.err.println(""+ioef); 
            socket.close(); 
          } catch (IOException ioe) { }; 
       }
    }catch (IOException ioes) { 
       //Couldn't open the Socket 
       System.err.println(""+ioes); 
    }
    glistener.stop();
  }
  
  public void display(String destination, String seat, String gate){
    infoHeader+="\n" + String.format("%-25s", destination) + String.format("%-8s", seat)  + gate;
    info.setText(infoHeader);  
  } 

}
