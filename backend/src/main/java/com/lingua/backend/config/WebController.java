package com.lingua.backend.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class WebController {

 
  @GetMapping({"/", "/{path:[^\\.]*}", "/**/{path:[^\\.]*}"})
  public String forward() {
    return "forward:/index.html";
  }
}
