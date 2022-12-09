package com.ibm.srm.filters;

import java.io.IOException;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpServletResponseWrapper;

public class XHTMLFilter implements Filter {

	public void destroy() {
		// TODO Auto-generated method stub

	}

	public void doFilter(ServletRequest req, ServletResponse res,
			FilterChain chain) throws IOException, ServletException {
		System.out.println("XHTML filter");
		// make sure we are dealing with HTTP
		if (req instanceof HttpServletRequest) {
			HttpServletRequest request = (HttpServletRequest) req;
			HttpServletResponse response = (HttpServletResponse) res;
			// check for the HTTP header that signifies XHTML support
			String accept = request.getHeader("accept");
			if (!accept.contains("application/xhtml+xml")) {
				System.out.println("XHTML is not supported, setting content-type to HTML");
				response.setContentType("text/html");
			} else {
				response.setContentType("application/xhtml+xml");				
			}
			// continue the chain, but prevent content type from being changed back
			// to XHTML
			chain.doFilter(req, new HttpServletResponseWrapper(response) {
				public void setContentType(String s) {
					if (s.startsWith("application/xhtml+xml")) {
						// do nothing. This call could be trying to set the
						// charset to another charset.
						// This is the case with Tomcat & Jetty, whose JSP
						// compiler sets the charset, whether it
						// is specified in the JSP page or not.
					} else {
						System.out.println("EncodingFilter.setContentType " + s);
						super.setContentType(s);
					}
				}
			});
		}
	}

	public void init(FilterConfig arg0) throws ServletException {
		// TODO Auto-generated method stub

	}

}
