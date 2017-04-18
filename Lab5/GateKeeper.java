import java.io.*;
import java.util.*;
import java.net.*;
import java.awt.*;
import java.awt.event.*;

public class GateKeeper
{
  public static void main(String[] args)
  {
    Logo clogo = new Logo("carmoncar.png");
    Logo vlogo = new Logo("vanderides.png");
    
    //find IP address of mine and servers
      String myIP = "128.112.224.20";
    System.out.println(myIP);
    
    String ipAddressc = "128.112.224.62";
    String ipAddressv = "orf-vanderfly.princeton.edu";
    
    //create new GateInformationBoard
    GateInformationBoard boardc = new GateInformationBoard(myIP, ipAddressc, 8189, 51000, clogo);

    GateInformationBoard boardv = new GateInformationBoard(myIP, ipAddressv, 8189, 51001, vlogo);

    boardc.StartUp();
    boardv.StartUp();
  }
}
