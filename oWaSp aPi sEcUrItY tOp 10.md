# OWASP API Security Top 10

**Source**: <https://owasp.org/www-project-api-security/>
**License**: Creative Commons Attribution-ShareAlike 4.0
**Downloaded**: 2026-02-07T07:28:58.991Z

---

## Full Content

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">

<meta name="description" content="The API Security project focuses on strategies and solutions to understand and mitigate the unique vulnerabilities and security risks of Application Programming Interfaces (APIs)">
<meta property="og:description" content="The API Security project focuses on strategies and solutions to understand and mitigate the unique vulnerabilities and security risks of Application Programming Interfaces (APIs)">
<meta property="og:title" content="OWASP API Security Project | OWASP Foundation">
<meta property="og:url" content="https://owasp.org/www-project-api-security/">
<meta property="og:locale" content="en_US">

<!-- should probably look at using article at some point for www-community at least -->
<meta property="og:type" content="website" />
<meta property="og:image" content="https://owasp.org/www--site-theme/favicon.ico" />
<meta http-equiv="X-Content-Type-Options" content="nosniff">
<meta http-equiv="X-XSS-Protection" content="1; mode=block">

<link rel="canonical" href="https://owasp.org/www-project-api-security/" />
<!-- Global site tag (gtag.js) - Google Analytics -->
<!-- <script async src="https://www.googletagmanager.com/gtag/js?id=UA-4531126-1"></script> -->
<!-- <script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'UA-4531126-1');
</script> -->
<!-- Google Analytics -->

<script src="https://owasp.org/www--site-theme/assets/js/js.cookie.min.js"></script>
<script>
  if(Cookies.get('cookies-ok') == 'true' && window.ga === undefined)
  {
    window.ga=window.ga||function(){(ga.q=ga.q||[]).push(arguments)};ga.l=+new Date;
    ga('create', 'UA-4531126-1', 'auto');
    ga('send', 'pageview');
  }
  else if (Cookies.get('cookies-ok') == 'true')
  {
    ga('send', 'pageview');
  }

  function handleOutboundLinkClicks(event) {
    var href = '';
    if(event.target.href == undefined)
      href = event.target.parentElement.href;
    else
      href = event.target.href
  if(Cookies.get('cookies-ok') == 'true'){  

    ga('send', 'event', {
      eventCategory: 'Outbound Link',
      eventAction: 'click',
      eventLabel: href,
      transport: 'beacon'
    });
  }
}
</script>
<script async src='https://www.google-analytics.com/analytics.js'></script>
<!-- End Google Analytics -->
<link rel="stylesheet" href="https://owasp.org/www--site-theme/assets/css/styles.css">
<link rel="shortcut icon" type="images/x-icon" href="https://owasp.org/www--site-theme/favicon.ico">

<script src="https://owasp.org/www--site-theme/assets/js/jquery-3.7.1.min.js"></script>
<script src="https://owasp.org/www--site-theme/assets/js/util.js"></script>
<script src="https://owasp.org/www--site-theme/assets/js/yaml.min.js"></script>
<script src="https://owasp.org/www--site-theme/assets/js/kjua.min.js"></script>
<title>OWASP API Security Project | OWASP Foundation</title>

    <script type="text/javascript">
      $(function(){
        var baseurl = "https://github.com/OWASP/www-project-api-security/blob/master/";
        var path = "index.md";
        $('.repo').html('<a href=' + baseurl + path + '><div class="reset-3c756112--menuItemIcon-206eb252" style="float: left;"><svg preserveAspectRatio="xMidYMid meet" height="1em" width="1em" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 438.549 438.549" stroke="none" class="icon-7f6730be--text-3f89f380"><g><path d="M409.132 114.573c-19.608-33.596-46.205-60.194-79.798-79.8-33.598-19.607-70.277-29.408-110.063-29.408-39.781 0-76.472 9.804-110.063 29.408-33.596 19.605-60.192 46.204-79.8 79.8C9.803 148.168 0 184.854 0 224.63c0 47.78 13.94 90.745 41.827 128.906 27.884 38.164 63.906 64.572 108.063 79.227 5.14.954 8.945.283 11.419-1.996 2.475-2.282 3.711-5.14 3.711-8.562 0-.571-.049-5.708-.144-15.417a2549.81 2549.81 0 0 1-.144-25.406l-6.567 1.136c-4.187.767-9.469 1.092-15.846 1-6.374-.089-12.991-.757-19.842-1.999-6.854-1.231-13.229-4.086-19.13-8.559-5.898-4.473-10.085-10.328-12.56-17.556l-2.855-6.57c-1.903-4.374-4.899-9.233-8.992-14.559-4.093-5.331-8.232-8.945-12.419-10.848l-1.999-1.431c-1.332-.951-2.568-2.098-3.711-3.429-1.142-1.331-1.997-2.663-2.568-3.997-.572-1.335-.098-2.43 1.427-3.289 1.525-.859 4.281-1.276 8.28-1.276l5.708.853c3.807.763 8.516 3.042 14.133 6.851 5.614 3.806 10.229 8.754 13.846 14.842 4.38 7.806 9.657 13.754 15.846 17.847 6.184 4.093 12.419 6.136 18.699 6.136 6.28 0 11.704-.476 16.274-1.423 4.565-.952 8.848-2.383 12.847-4.285 1.713-12.758 6.377-22.559 13.988-29.41-10.848-1.14-20.601-2.857-29.264-5.14-8.658-2.286-17.605-5.996-26.835-11.14-9.235-5.137-16.896-11.516-22.985-19.126-6.09-7.614-11.088-17.61-14.987-29.979-3.901-12.374-5.852-26.648-5.852-42.826 0-23.035 7.52-42.637 22.557-58.817-7.044-17.318-6.379-36.732 1.997-58.24 5.52-1.715 13.706-.428 24.554 3.853 10.85 4.283 18.794 7.952 23.84 10.994 5.046 3.041 9.089 5.618 12.135 7.708 17.705-4.947 35.976-7.421 54.818-7.421s37.117 2.474 54.823 7.421l10.849-6.849c7.419-4.57 16.18-8.758 26.262-12.565 10.088-3.805 17.802-4.853 23.134-3.138 8.562 21.509 9.325 40.922 2.279 58.24 15.036 16.18 22.559 35.787 22.559 58.817 0 16.178-1.958 30.497-5.853 42.966-3.9 12.471-8.941 22.457-15.125 29.979-6.191 7.521-13.901 13.85-23.131 18.986-9.232 5.14-18.182 8.85-26.84 11.136-8.662 2.286-18.415 4.004-29.263 5.146 9.894 8.562 14.842 22.077 14.842 40.539v60.237c0 3.422 1.19 6.279 3.572 8.562 2.379 2.279 6.136 2.95 11.276 1.995 44.163-14.653 80.185-41.062 108.068-79.226 27.88-38.161 41.825-81.126 41.825-128.906-.01-39.771-9.818-76.454-29.414-110.049z"></path></g></svg><span style="padding-left:8px;">Edit on GitHub</span></div></a>');
      });
    </script>
    <script async defer src="https://buttons.github.io/buttons.js"></script>
  </head>
  <body class="base-grid col-sidebar">

    <div id="blocker"></div>

    <noscript>For full functionality of this site it is necessary to enable JavaScript. Here are the <a href="http://turnonjs.com/"> instructions how to enable JavaScript in your web browser</a>.</noscript>
    <header role="banner">
  <div id="banner" class="notice" aria-label="announcement">
</div>

<style>
  #banner img {
    max-width: 30em;
  }

  @media (max-width: 1131px) {
    #banner img {
      max-width: 30em;
    }
  }

  @media (max-width: 800px) {
    #banner img {
      max-width: 20em;
    }
  }

  @media (max-width: 600px) {
    #banner img {
      max-width: 20em;
    }
  }

  @media (max-width: 450px) {
    #banner img {
      max-width: 250px;
    }
  }
</style>

<script type="text/javascript">
  $(function () {
    var bannerdata = [];
    banneryaml = YAML.load('https://owasp.org/www-project-api-security/assets/sitedata/banner-data.yml');
    $.each(banneryaml, function (index) {
      bannerdata.push(this);
    });

    if (bannerdata.length > 0) {
      var htmlstring = "";
      var usebanner = null;
      var defbanner = null;
      var checkdate = new Date(); //local time but who cares about the time?
      bannerdata.forEach(data => {
        if (data.start) {
          var start = data.start;

          if (data.start <= checkdate) {
            if (data.end) {

              var end = data.end;
              if (checkdate < end) {
                usebanner = data;
              }
            }
            else
              usebanner = data;
          }
        }
        else {
          defbanner = data;
        }
      });

      if (defbanner && !usebanner)
        usebanner = defbanner;
      if (usebanner) {
        htmlstring = usebanner.text;
        htmlstring += "<a href='#' id='close-banner' aria-label='close announcement' style='float:right;'><i class='fa fa-times'></i></a>";

        $("#banner").html(htmlstring);
        $("#banner").removeClass("notice");
        $("#banner").addClass(usebanner.type);

        $("#close-banner").click(function() {
          $(this).closest("#banner").remove();
            Cookies.set('banner-seen', 'true', { expires: 7 });
        });
      }
    }
  });
</script>
  <div id="popup" class="notice" aria-label="announcement">

</div>

<style>
  #banner img {
    max-width: 30em;
  }

  @media (max-width: 1131px) {
    #banner img {
      max-width: 30em;
    }
  }

  @media (max-width: 800px) {
    #banner img {
      max-width: 20em;
    }
    #popup {
      visibility: hidden;
    }
  }

  @media (max-width: 600px) {
    #popup {
      visibility: hidden;
    }
    #banner img {
      max-width: 20em;
    }
  }

  @media (max-width: 450px) {
    #banner img {
      max-width: 250px;
    }
    #popup {
      visibility: hidden;
    }
  }
</style>

<script type="text/javascript">
  $(function () {
    var popdata = [];
    $("#popup").hide();
    popyaml = YAML.load('https://owasp.org/www-project-api-security/assets/sitedata/popup-data.yml');
    $.each(popyaml, function (index) {
      popdata.push(this);
    });

    if (popdata.length > 0) {
      var htmlstring = "";
      var usepop = null;
      var defpop = null;
      var checkdate = new Date(); //local time but who cares about the time?
      popdata.forEach(data => {
        if (data.start) {
          var start = data.start;

          if (data.start <= checkdate) {
            if (data.end) {

              var end = data.end;
              if (checkdate < end) {
                usepop = data;
              }
            }
            else
              usepop = data;
          }
        }
        else {
          defpop = data;
        }
      });

      if (defpop && !usepop)
        usepop = defpop;
      if (usepop) {
        htmlstring = usepop.text;
        htmlstring += "<a href='#' id='close-popup' aria-label='close announcement' style='float:right;'><i class='fa fa-times'></i></a>";

        $("#popup").html(htmlstring);
        $("#popup").removeClass("notice");
        $("#popup").addClass(usepop.type);

        if( Cookies.get('popup-seen')!='true')
        {
          $("#popup").show();
        }

        $("#close-popup").click(function() {
          $(this).closest("#popup").remove();
            Cookies.set('popup-seen', 'true', { expires: 7 });
        });
      }
    }
  });
</script>
  <div class="header-wrapper" aria-label="main navigation">
    <nav class="alt-nav">
      <a href="#" class="menu-toggler" aria-hidden="true">
        <i class="fa fa-bars"></i>
      </a>
      <a href="https://owasp.org/" class="alt-logo" aria-label="go to homepage">
          <img src="https://owasp.org/assets/images/logo.png" alt="OWASP logo">
      </a>
      <div id="overlay" class="remove-el">

      </div>
      <!-- jekyll menu stuff -->
    </nav>
    
    <nav class="top-nav" role="navigation" aria-label="primary navigation">
      <a href="https://owasp.org/" class="desktop-logo" aria-label="go to homepage">
        <img src="https://owasp.org/assets/images/logo.png" alt="">
      </a>
      <!-- jekyll menu stuff -->
      <div id="midmenu" class="top-nav"></div>
      
      

      <div class="interactive-wrapper">                
        <div class="nav-button" aria-label="donate to or join OWASP">
        
          <a href="https://owasp.org/store" class="cta-button white inset"><i class="fa fa-shopping-cart" aria-hidden="true"></i> Store</a>
          <a href="https://owasp.org/donate?reponame=www-project-api-security&title=OWASP+API+Security+Project" class="cta-button green">Donate</a>
          <a href="https://owasp.glueup.com/organization/6727/memberships" class="cta-button">Join</a>
        </div>
      </div>
    </nav>
    <div id='disclaimer-container'>
<div id="disclaimer">
    <p>This website uses cookies to analyze our traffic and only share that information with our analytics partners.</p><a class="disclaimerOK">Accept</a>
</div>
<div id="close-disclaimer">x</div>
</div>
  </div>
  <div class="mobile" style="width:100%;display: flex; justify-content: space-evenly;align-items: center;padding: 8px; background-color: #98afc7;">
    <div><a href="https://owasp.org/store" class="cta-button white inset"><i class="fa fa-shopping-cart" aria-hidden="true"></i>Store</a></div>
    <div><a href="https://owasp.org/donate?reponame=www-project-api-security&title=OWASP+API+Security+Project" class="cta-button green">Donate</a></div>
    <div><a href="https://owasp.glueup.com/organization/6727/memberships" class="cta-button">Join</a></div>
  </div>

<script type="text/javascript">
  $(function(){

      url = $(location).attr('href');
      if(url.includes('www2'))
      {
        url = url.replace(/www2./, '');
        $(location).attr('href',url);
        return;
      }
    // this works to get data from a json file NOT in data
      $.getJSON("https://owasp.org/www--site-theme/assets/sitedata/menus.json", function(data) {
         var listr = "<ul aria-label='header menu'>";

         var mlistr = "<ul class='mobile-menu hide-el' role='navigation' aria-label='mobile primary navigation'>";

          mlistr += "<li><a href='#' class='menu-toggler' aria-hidden='true'><i class='fa fa-times'></i></a></li>";
          mlistr += "<li>";
          mlistr += "<form role='search' method='get' action='https://owasp.org/search'>";
          mlistr += "<div class='search-div'>";
          mlistr += "<input id='searchString' aria-label='search input' name='searchString' class='search-bar' type='search' placeholder='Search OWASP.org' required='true'>";
          mlistr += "<button id='search-button' aria-label='search button' type='submit' class='fa fa-search' style='padding-left: 8px;'></button></div></form>";
          mlistr += "</li>";
          $.each(data.menus, function (ndx, menu){
              listr += "<li><a href='" + menu.url + "'>" + menu.title + "</a>";
              searchitem = issearch(menu.title);
              if(!menu.items && !searchitem)
              {
                  mlistr += "<li><a href='" + menu.url + "'>" + menu.title + "</a>";
              }

              if(menu.items){
                  listr += "<ul class='dropdown-menu'>";
                  if(!searchitem) {
                    mlistr += "<button class='accordion'>" + menu.title + "</button>";
                    mlistr += "<div class='panel'>";
                    mlistr += "<ul>";
                  }
                $.each(menu.items, function(ndx, item){

                  if(item.separator)
                  {
                      listr += "<li class='separator'>";
                      if(!searchitem)
                        mlistr += "<li class='separator'>";
                  }
                  else
                  {
                      listr += "<li>";
                      if(!searchitem)
                        mlistr += "<li>";
                  }
                  listr += "<a href='" + item.url + "'";
                  if(!searchitem)
                    mlistr += "<a href='" + item.url + "'";
                  if(item.opentab)
                  {
                    listr += " target='_blank' rel='noopener noreferrer'";
                    if(!searchitem)
                      mlistr += " target='_blank' rel='noopener noreferrer'";
                  }

                  listr += ">" + item.title + "</a></li>";
                  if(!searchitem)
                    mlistr += ">" + item.title + "</a></li>";
                });
                listr += "</ul>";
                if(!searchitem){
                  mlistr += "</ul>";
                  mlistr += "</div>";
                }
              }

              listr += "</li>";
              if(!searchitem)
                mlistr += "</li>";
          });
          listr += "</ul>";
          mlistr += "<li><a href='https://owasp.org/donate'>MAKE A DONATION</a></li>";
          mlistr += "<li><a href='https://owasp.org/membership'>BECOME A MEMBER</a></li>";
          mlistr += "<li><a href='https://owasp.org/sitemap'>SITEMAP</a></li>";
          mlistr += "</ul>";

          //$('.desktop-logo').after(listr);
          $('#midmenu').html(listr);
          $('#overlay').after(mlistr);

          $(".accordion").click(function () {
              $(this).toggleClass("active");
              if($(this).next('.panel').css('display') == 'block'){
                $(this).next('.panel').css('display', 'none');
              }
              else {
                $(this).next('.panel').css('display', 'block');
              }
            });
            $(".menu-toggler").click(function() {
              $(".mobile-menu").toggleClass('hide-el');
            });
      });
    });

    function issearch(title) {
      return title.indexOf('fa fa-search') > -1;
    }
  </script>
</header>

    <main role="main">
      <div class="main-wrapper">
        
  
<nav class="sub-nav" role="navigation" aria-label="navigate page tabs">
  <ul role="tablist">
      <li>

          <a href="#div-main" id="main-link" class="tab-link current" role="tab" aria-selected="true" aria-controls="main">Main</a>
     </li>
    
      
        <li>
            <a href="#div-acknowledgments" id="acknowledgments-link" class="tab-link" role="tab" aria-selected="false" aria-controls="acknowledgments">Acknowledgments</a>
        </li>
      
    
      
        <li>
            <a href="#div-join" id="join-link" class="tab-link" role="tab" aria-selected="false" aria-controls="join">Join</a>
        </li>
      
    
      
        <li>
            <a href="#div-news" id="news-link" class="tab-link" role="tab" aria-selected="false" aria-controls="news">News</a>
        </li>
      
    
      
        <li>
            <a href="#div-roadmap" id="roadmap-link" class="tab-link" role="tab" aria-selected="false" aria-controls="roadmap">RoadMap</a>
        </li>
      
    
      
        <li>
            <a href="#div-translations" id="translations-link" class="tab-link" role="tab" aria-selected="false" aria-controls="translations">Translations</a>
        </li>
      
    
  </ul>
</nav>
<script type='text/javascript'>
  $(function() {
    if(window.location.href.indexOf('#') != -1)
     {
        divid = window.location.href.substring(window.location.href.indexOf('#'))
        secid = divid;
        if(divid.indexOf('div-') >= 0)
        {
          $('.tab-link').each(function () {
            divid = '#sec-' + $(this).attr('id').toLowerCase().replace('-link', '');
            $(divid).addClass('tab-hidden');
            $(this).removeClass('current');
          });

          secid = secid.replace('div-', 'sec-');
          $(secid).removeClass('tab-hidden');
          linkid = "#" + secid.substring(secid.indexOf('-') + 1) + "-link";
          $(linkid).addClass('current'); 
          
        }
        
     }
  });

  $('.tab-link').click(function (e) {
    e.preventDefault();

    $('.tab-link').each(function () {
      $(this).removeClass('current');
      divid = '#sec-' + $(this).attr('id').toLowerCase().replace('-link', '');
      $(divid).addClass('tab-hidden'); 
    });

     divid = '#sec-' + $(this).attr('id').toLowerCase().replace('-link', '');
     $(this).addClass('current');
     $(divid).removeClass('tab-hidden');
     return false;
  });
</script>

        <h1 class="page-title">OWASP API Security Project</h1>
        <div id="main" class="page-body tab" role="tabpanel" aria-labelledby="main-link" tabindex="0">
          
          <section id='sec-main' class='page-body'>
          <div class="alert">
  <p style="text-align:center">
    Check out the new
    <a href="https://owasp.org/API-Security/editions/2023/en/0x00-header/">
      OWASP API Security Top 10 2023
    </a>!
  </p>
</div>

<h2 id="what-is-api-security">What is API Security?</h2>

<p>A foundational element of innovation in today’s app-driven world is the API.
From banks, retail and transportation to IoT, autonomous vehicles and smart
cities, APIs are a critical part of modern mobile, SaaS and web applications and
can be found in customer-facing, partner-facing and internal applications. By
nature, APIs expose application logic and sensitive data such as Personally
Identifiable Information (PII) and because of this have increasingly become a
target for attackers. Without secure APIs, rapid innovation would be impossible.</p>

<p>API Security focuses on strategies and solutions to understand and mitigate the
unique vulnerabilities and security risks of Application Programming Interfaces
(APIs).</p>

<h2 id="api-security-top-10-2023">API Security Top 10 2023</h2>

<p>Here is a sneak peek of the 2023 version:</p>

<ul>
  <li>
    <p><strong><a href="https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/">API1:2023 - Broken Object Level Authorization</a></strong></p>

    <p>APIs tend to expose endpoints that handle object identifiers, creating a wide
attack surface of Object Level Access Control issues. Object level
authorization checks should be considered in every function that accesses a
data source using an ID from the user. <a href="https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/">Continue reading</a>.</p>
  </li>
  <li>
    <p><strong><a href="https://owasp.org/API-Security/editions/2023/en/0xa2-broken-authentication/">API2:2023 - Broken Authentication</a></strong></p>

    <p>Authentication mechanisms are often implemented incorrectly, allowing
attackers to compromise authentication tokens or to exploit implementation
flaws to assume other user’s identities temporarily or permanently.
Compromising a system’s ability to identify the client/user, compromises API
security overall. <a href="https://owasp.org/API-Security/editions/2023/en/0xa2-broken-authentication/">Continue reading</a>.</p>
  </li>
  <li>
    <p><strong><a href="https://owasp.org/API-Security/editions/2023/en/0xa3-broken-object-property-level-authorization/">API3:2023 - Broken Object Property Level Authorization</a></strong></p>

    <p>This category combines <a href="https://owasp.org/API-Security/editions/2019/en/0xa3-excessive-data-exposure/">API3:2019 Excessive Data Exposure</a> and
<a href="https://owasp.org/API-Security/editions/2019/en/0xa6-mass-assignment/">API6:2019 - Mass Assignment</a>, focusing on the root cause: the lack
of or improper authorization validation at the object property level. This
leads to information exposure or manipulation by unauthorized parties.
<a href="https://owasp.org/API-Security/editions/2023/en/0xa3-broken-object-property-level-authorization/">Continue reading</a>.</p>
  </li>
  <li>
    <p><strong><a href="https://owasp.org/API-Security/editions/2023/en/0xa4-unrestricted-resource-consumption/">API4:2023 - Unrestricted Resource Consumption</a></strong></p>

    <p>Satisfying API requests requires resources such as network bandwidth, CPU,
memory, and storage. Other resources such as emails/SMS/phone calls or
biometrics validation are made available by service providers via API
integrations, and paid for per request. Successful attacks can lead to Denial
of Service or an increase of operational costs. <a href="https://owasp.org/API-Security/editions/2023/en/0xa4-unrestricted-resource-consumption/">Continue reading</a>.</p>
  </li>
  <li>
    <p><strong><a href="https://owasp.org/API-Security/editions/2023/en/0xa5-broken-function-level-authorization/">API5:2023 - Broken Function Level Authorization</a></strong></p>

    <p>Complex access control policies with different hierarchies, groups, and roles,
and an unclear separation between administrative and regular functions, tend
to lead to authorization flaws. By exploiting these issues, attackers can gain
access to other users’ resources and/or administrative functions. <a href="https://owasp.org/API-Security/editions/2023/en/0xa5-broken-function-level-authorization/">Continue
reading</a>.</p>
  </li>
  <li>
    <p><strong><a href="https://owasp.org/API-Security/editions/2023/en/0xa6-unrestricted-access-to-sensitive-business-flows/">API6:2023 - Unrestricted Access to Sensitive Business Flows</a></strong></p>

    <p>APIs vulnerable to this risk expose a business flow - such as buying a ticket,
or posting a comment - without compensating for how the functionality could
harm the business if used excessively in an automated manner. This doesn’t
necessarily come from implementation bugs. <a href="https://owasp.org/API-Security/editions/2023/en/0xa6-unrestricted-access-to-sensitive-business-flows/">Continue reading</a>.</p>
  </li>
  <li>
    <p><strong><a href="https://owasp.org/API-Security/editions/2023/en/0xa7-server-side-request-forgery/">API7:2023 - Server Side Request Forgery</a></strong></p>

    <p>Server-Side Request Forgery (SSRF) flaws can occur when an API is fetching a
remote resource without validating the user-supplied URI. This enables an
attacker to coerce the application to send a crafted request to an unexpected
destination, even when protected by a firewall or a VPN. <a href="https://owasp.org/API-Security/editions/2023/en/0xa7-server-side-request-forgery/">Continue
reading</a>.</p>
  </li>
  <li>
    <p><strong><a href="https://owasp.org/API-Security/editions/2023/en/0xa8-security-misconfiguration/">API8:2023 - Security Misconfiguration</a></strong></p>

    <p>APIs and the systems supporting them typically contain complex configurations,
meant to make the APIs more customizable. Software and DevOps engineers can
miss these configurations, or don’t follow security best practices when it
comes to configuration, opening the door for different types of attacks.
<a href="https://owasp.org/API-Security/editions/2023/en/0xa8-security-misconfiguration/">Continue reading</a>.</p>
  </li>
  <li>
    <p><strong><a href="https://owasp.org/API-Security/editions/2023/en/0xa9-improper-inventory-management/">API9:2023 - Improper Inventory Management</a></strong></p>

    <p>APIs tend to expose more endpoints than traditional web applications, making
proper and updated documentation highly important. A proper inventory of hosts
and deployed API versions also are important to mitigate issues such as
deprecated API versions and exposed debug endpoints. <a href="https://owasp.org/API-Security/editions/2023/en/0xa9-improper-inventory-management/">Continue
reading</a>.</p>
  </li>
  <li>
    <p><strong><a href="https://owasp.org/API-Security/editions/2023/en/0xaa-unsafe-consumption-of-apis/">API10:2023 - Unsafe Consumption of APIs</a></strong></p>

    <p>Developers tend to trust data received from third-party APIs more than user
input, and so tend to adopt weaker security standards. In order to compromise
APIs, attackers go after integrated third-party services instead of trying to
compromise the target API directly. <a href="https://owasp.org/API-Security/editions/2023/en/0xaa-unsafe-consumption-of-apis/">Continue reading</a>.</p>
  </li>
</ul>

<h2 id="licensing">Licensing</h2>

<p><strong>The OWASP API Security Project documents are free to use!</strong></p>

<p>The OWASP API Security Project is licensed under the <a href="https://creativecommons.org/licenses/by-sa/4.0/">Creative Commons
Attribution-ShareAlike 4.0 license</a>, so you can copy, distribute and
transmit the work, and you can adapt it, and use it commercially, but all
provided that you attribute the work and if you alter, transform, or build upon
this work, you may distribute the resulting work only under the same or similar
license to this one.</p>

          </section>
          

          
          
          
          
          
          
          <section id='sec-acknowledgments' class='page-body tab-hidden'>
            
            
            
            
            
            
<hr />

<h2 id="founders">Founders</h2>

<ul>
  <li><a href="https://www.owasp.org/index.php/User:ErezYalon">Erez Yalon</a></li>
  <li><a href="https://www.owasp.org/index.php/User:Inon">Inon Shkedy</a></li>
</ul>

<h2 id="leaders">Leaders</h2>

<ul>
  <li><a href="https://www.owasp.org/index.php/User:ErezYalon">Erez Yalon</a></li>
  <li><a href="https://www.owasp.org/index.php/User:Inon">Inon Shkedy</a></li>
  <li><a href="https://www.owasp.org/index.php/User:PauloASilva">Paulo Silva</a></li>
</ul>

<h2 id="2023-sponsors">2023 Sponsors</h2>

<p><img src="assets/images/sponsors/cequence-security.png" alt="Cequence Security" height="96px" /></p>

<p><img src="assets/images/sponsors/checkmarx.png" alt="Checkmarx" height="96px" /></p>

<p><img src="assets/images/sponsors/equixly.png" alt="Equixly" height="96px" /></p>

<p><img src="assets/images/sponsors/impart.png" alt="Impart Security" height="96px" /></p>

<p><img src="assets/images/sponsors/salt.png" alt="Salt Security" height="96px" /></p>

<p><img src="assets/images/sponsors/traceable.png" alt="Traceable" height="96px" /></p>

<h2 id="2023-contributors">2023 Contributors</h2>

<p>247arjun, abunuwas, Alissa Knight, Arik Atar, aymenfurter, Corey J. Ball, cyn8,
d0znpp, Dan Gordon, donge, Dor Tumarkin, faizzaidi, gavjl, guybensimhon, Inês
Martins, Isabelle Mauny, Ivan Novikov, jmanico, Juan Pablo, k7jto, LaurentCB,
llegaz, Maxim Zavodchik, MrPRogers, planetlevel, rahulk22, Roey Eliyahu, Roshan
Piyush, securitylevelup, sudeshgadewar123, Tatsuya-hasegawa, tebbers, vanderaj,
wenz, xplo1t-sec, Yaniv Balmas, ynvb</p>

<h2 id="2019-contributors">2019 Contributors</h2>

<p>007divyachawla, Abid Khan, Adam Fisher, anotherik, bkimminich, caseysoftware,
Chris Westphal, dsopas, DSotnikov, emilva, ErezYalon, flascelles, Guillaume
Benats, IgorSasovets, Inonshk, JonnySchnittger, jmanico, jmdx, Keith Casey,
kozmic, LauraRosePorter, Matthieu Estrade, nathanawmk, PauloASilva, pentagramz,
philippederyck, pleothaud, r00ter, Raj kumar, Sagar Popat, Stephen Gates,
thomaskonrad, xycloops123, Raphael Hagi, Eduardo Bellis, Bruno Barbosa</p>

          </section>
          
          
          
          <section id='sec-join' class='page-body tab-hidden'>
            
            
            
            
            
            
<hr />

<h2 id="google-group">Google Group</h2>

<p>Join the discussion on the <a href="https://groups.google.com/a/owasp.org/d/forum/api-security-project">OWASP API Security Project Google group</a>.</p>

<p>This is the best place to introduce yourself, ask questions, suggest and discuss
any topic that is relevant to the project.</p>

<h2 id="github-discussions">GitHub Discussions</h2>

<p>You can also use <a href="https://github.com/OWASP/API-Security/discussions">GitHub Discussions</a> as a place to connect with other community
members, asking questions or sharing ideas.</p>

<h2 id="github">GitHub</h2>

<p>The project is maintained in the <a href="https://github.com/OWASP/API-Security">OWASP API Security Project repo</a>.</p>

<p><strong>The latest changes are under the <a href="https://github.com/OWASP/API-Security/tree/develop"><code class="language-plaintext highlighter-rouge">develop</code> branch</a></strong>.</p>

<p>Feel free to open or solve an <a href="https://github.com/OWASP/API-Security/issues">issue</a>.</p>

<p>Ready to contribute directly into the repo? Great! Just make sure you read the
<a href="https://github.com/OWASP/API-Security/blob/master/CONTRIBUTING.md">How to Contribute guide</a>.</p>

          </section>
          
          
          
          <section id='sec-news' class='page-body tab-hidden'>
            
            
            
            
            
            
<hr />

<ul>
  <li>
    <p><strong>Jun 28th, 2024</strong></p>

    <p>OWASP API Security Project - Past Present and Future @ OWASP Global AppSec
Lisbon 2024 (<a href="https://www.youtube.com/watch?v=hn4mgTu5izg">YouTube</a>)</p>
  </li>
  <li>
    <p><strong>Jun 3rd, 2024</strong></p>

    <p><a href="https://owasp.org/API-Security/editions/2023/fr/0x00-header/">OWASP API Security Top 10 2023 French translation</a> release.</p>
  </li>
  <li>
    <p><strong>Jun 5th, 2023</strong></p>

    <p><a href="https://owasp.org/API-Security/editions/2023/en/0x00-header/">OWASP API Security Top 10 2023</a> stable version was publicly
released.</p>
  </li>
  <li>
    <p><strong>Feb 14, 2023</strong></p>

    <p><a href="announcements/2023/02/api-top10-2023rc">OWASP API Security Top 10 2023 Release Candidate</a> is
now available.</p>
  </li>
  <li>
    <p><strong>Aug 30, 2022</strong></p>

    <p><a href="announcements/cfd/2022/">OWASP API Security Top 10 2022 call for data</a>
is open.</p>
  </li>
  <li>
    <p><strong>Oct 30, 2020</strong></p>

    <p><a href="https://cheatsheetseries.owasp.org/cheatsheets/GraphQL_Cheat_Sheet.html">GraphQL Cheat Sheet</a> release.
A truly community effort whose <a href="https://github.com/OWASP/CheatSheetSeries/pull/434">log and contributors list are available at
GitHub</a>.</p>
  </li>
  <li>
    <p><strong>Apr 4, 2020</strong></p>

    <p><a href="https://github.com/OWASP/API-Security/raw/master/2019/pt-pt/dist/owasp-api-security-top-10.pdf">OWASP API Security Top 10 2019 pt-PT translation</a> release.</p>
  </li>
  <li>
    <p><strong>Mar 27, 2020</strong></p>

    <p><a href="https://github.com/OWASP/API-Security/raw/master/2019/pt-br/dist/owasp-api-security-top-10-pt-br.pdf">OWASP API Security Top 10 2019 pt-BR translation</a> release.</p>
  </li>
  <li>
    <p><strong>Dec 26, 2019</strong></p>

    <p>OWASP API Security Top 10 2019 stable version release.</p>
  </li>
  <li>
    <p><strong>Sep 30, 2019</strong></p>

    <p>The RC of API Security Top-10 List was published during <a href="https://ams.globalappsec.org/">OWASP Global AppSec
Amsterdam</a> (<a href="https://github.com/OWASP/www-project-api-security/raw/master/assets/presentations/api-security-top10-rc-global-appsec-ams.pdf">slide deck</a>)</p>
  </li>
  <li>
    <p><strong>Sep 13, 2019</strong></p>

    <p>The RC of API Security Top-10 List was published during <a href="https://dc.globalappsec.org/">OWASP Global AppSec
DC</a> (<a href="https://github.com/OWASP/www-project-api-security/raw/master/assets/presentations/api-security-top10.pdf">slide deck</a>)</p>
  </li>
  <li>
    <p><strong>May 30, 2019</strong></p>

    <p>The API Security Project was Kicked-Off during <a href="https://telaviv.appsecglobal.org/">OWASP Global AppSec Tel
Aviv</a> (<a href="https://github.com/OWASP/www-project-api-security/raw/master/assets/presentations/owasp-api-security-project-kick-off.pdf">slide deck</a>)</p>
  </li>
</ul>

          </section>
          
          
          
          <section id='sec-roadmap' class='page-body tab-hidden'>
            
            
            
            
            
            
<hr />

<h2 id="planned-projects">Planned Projects</h2>

<ul>
  <li>API Security Top 10</li>
  <li>API Security Cheat Sheet</li>
  <li>crAPI - <strong>C</strong>ompletely <strong>R</strong>idiculous <strong>API</strong>, an intentionally vulnerable API
project)</li>
</ul>

<h2 id="roadmap">Roadmap</h2>

<p><img src="assets/images/roadmap.png" alt="Roadmap" /></p>

          </section>
          
          
          
          <section id='sec-translations' class='page-body tab-hidden'>
            
            
            
            
            
            
<hr />

<h2 id="owasp-api-security-top-10-2023">OWASP API Security Top 10 2023</h2>

<ul>
  <li>
    <p><a href="https://owasp.org/API-Security/editions/2023/id/0x00-header/">Bahasa (Indonesian)</a></p>

    <p><a href="https://github.com/faizzaidi">Faiz Ahmed Zaidi</a></p>
  </li>
  <li>
    <p><a href="https://owasp.org/API-Security/editions/2023/fr/0x00-header/">French</a></p>

    <p><a href="https://www.linkedin.com/in/aur%C3%A9lien-troncy-214075229/">Aurélien Troncy</a>, <a href="https://github.com/llegaz">Laurent Legaz</a></p>
  </li>
  <li>
    <p><a href="https://owasp.org/API-Security/editions/2023/fa/0x00-header/">Persian</a></p>

    <p><a href="https://www.linkedin.com/in/alireza-mostame-29970b242">Alireza Mostame</a>, <a href="https://www.linkedin.com/in/maryam-javadi-353b1744/">Maryam Javadi Hoseini</a>, <a href="https://www.linkedin.com/in/rezataba">Mohammad Reza Ismaeli Taba</a>,
<a href="https://www.linkedin.com/company/raspina-net-pars/" rel="nofollow">RNPG</a></p>
  </li>
  <li>
    <p><a href="https://owasp.org/API-Security/editions/2023/pt-pt/0x00-header/">Português (Portugal)</a></p>

    <p><a href="https://www.linkedin.com/in/rspro/">Rui Silva</a></p>
  </li>
</ul>

<h2 id="owasp-api-security-top-10-2019">OWASP API Security Top 10 2019</h2>

<ul>
  <li>
    <p><a href="https://owasp.org/API-Security/editions/2019/ar/0x00-header/">Arabic</a> (also available in <a href="https://owasp.org/API-Security/editions/2019/ar/dist/owasp-api-security-top-10-ar.pdf">PDF</a>, <a href="https://owasp.org/API-Security/editions/2019/ar/dist/owasp-api-security-top-10-ar.odt">ODT</a>)</p>

    <p><a href="https://twitter.com/malajab">Malek Aldossary</a>, <a href="https://twitter.com/kingsabri">Sabri Hassanyah</a>, <a href="https://twitter.com/malaqsm">Mostafa Alaqsm</a>, <a href="https://twitter.com/fahad_alduraibi">Fahad Alduraibi</a>,
<a href="https://twitter.com/t44t_">Thamer Alshammeri</a>, <a href="https://twitter.com/msuhaymi">Mohammed Alsuhaymi</a></p>
  </li>
  <li>
    <p><a href="https://owasp.org/API-Security/editions/2019/fr/0x00-header/">French</a> (also available in <a href="https://owasp.org/API-Security/editions/2019/fr/dist/owasp-api-security-top-10.pdf">PDF</a>, <a href="https://owasp.org/API-Security/editions/2019/fr/dist/owasp-api-security-top-10.odt">ODT</a>)</p>

    <p><a href="https://github.com/datakime">Fred</a>, <a href="https://github.com/llegaz">Laurent Legaz</a></p>
  </li>
  <li>
    <p><a href="https://owasp.org/API-Security/editions/2019/de/0x00-header/">German</a> (also available in <a href="https://owasp.org/API-Security/editions/2019/de/dist/owasp-api-security-top-10.pdf">PDF</a>, <a href="https://owasp.org/API-Security/editions/2019/de/dist/owasp-api-security-top-10.odt">ODT</a>)</p>

    <p><a href="https://www.linkedin.com/in/moritz-gruber-734a43199/">Moritz Gruber</a>, <a href="https://www.linkedin.com/in/nick-lorenz-16b211222/">Nick Lorenz</a>, <a href="https://www.linkedin.com/in/steffen-thamm-a8341a27b/">Steffen Thamm</a>, <a href="https://www.linkedin.com/in/domai-tb/">Tim B.</a></p>
  </li>
  <li>
    <p><a href="https://owasp.org/API-Security/editions/2019/el-gr/0x00-header/">Greek</a> (<a href="https://owasp.org/API-Security/editions/2019/el-gr/dist/owasp-api-security-top-10.pdf">PDF</a>, <a href="https://owasp.org/API-Security/editions/2019/el-gr/dist/owasp-api-security-top-10.odt">ODT</a>)</p>

    <p><a href="https://www.linkedin.com/in/athanasiosem/">Athanasios Emmanouilidis</a>, <a href="https://www.linkedin.com/in/giannakidisapostolos/">Apostolos Giannakidis</a></p>
  </li>
  <li>
    <p><a href="https://owasp.org/API-Security/editions/2019/fa/0x00-header/">Persian</a> (also available in <a href="https://owasp.org/API-Security/editions/2019/fa/dist/owasp-api-security-top-10.pdf">PDF</a>, <a href="https://owasp.org/API-Security/editions/2019/fa/dist/owasp-api-security-top-10.odt">ODT</a>)</p>

    <p><a href="https://www.linkedin.com/in/alireza-mostame-29970b242">Alireza Mostame</a>, <a href="https://www.linkedin.com/in/rezataba">Mohammad Reza Ismaeli Taba</a>, <a href="https://www.linkedin.com/in/amirmahdi-nowbakht-3b8865200">Amirmahdi Nowbakht</a>,
<a href="https://www.linkedin.com/company/raspina-net-pars/" rel="nofollow">RNPG</a></p>
  </li>
  <li>
    <p><a href="https://owasp.org/API-Security/editions/2019/pt-BR/0x00-header/">Portuguese (Brazil)</a> (also available in <a href="https://owasp.org/API-Security/editions/2019/pt-BR/dist/owasp-api-security-top-10-pt-br.pdf">PDF</a>, <a href="https://owasp.org/API-Security/editions/2019/pt-BR/dist/owasp-api-security-top-10-pt-br.odt">ODT</a>)</p>

    <p><a href="https://www.linkedin.com/in/raphael-hagi/">Raphael Hagi</a>, <a href="https://www.linkedin.com/in/eduardo-bellis-92482534/">Eduardo Bellis</a>,
<a href="https://www.linkedin.com/in/bbarbosa85/">Bruno Barbosa</a></p>
  </li>
  <li>
    <p><a href="https://owasp.org/API-Security/editions/2019/pt-pt/0x00-header/">Portuguese (Portugal)</a> (also available in <a href="https://owasp.org/API-Security/editions/2019/pt-pt/dist/owasp-api-security-top-10.pdf">PDF</a>, <a href="https://owasp.org/API-Security/editions/2019/pt-pt/dist/owasp-api-security-top-10.odt">ODT</a>)</p>

    <p><a href="https://www.linkedin.com/in/devpauloasilva/">Paulo A. Silva</a>, <a href="https://www.linkedin.com/in/rspro/">Rui Silva</a></p>
  </li>
  <li>
    <p><a href="https://owasp.org/API-Security/editions/2019/ru/0x00-header/">Russian</a> (also available in <a href="https://owasp.org/API-Security/editions/2019/ru/dist/owasp-api-security-top-10.pdf">PDF</a>, <a href="https://owasp.org/API-Security/editions/2019/ru/dist/owasp-api-security-top-10.odt">ODT</a>)</p>

    <p><a href="https://twitter.com/eugenerojavski">Eugene Rojavski</a>, <a href="https://twitter.com/act1on3">act1on3</a>, keni0k</p>
  </li>
</ul>

          </section>
          
          
       </div>
       <hr>
       <div class="repo">
       </div>

          <div class="github-buttons">
    <a class="github-button" href="https://github.com/OWASP/API-Security/subscription" data-icon="octicon-eye" data-size="large" data-show-count="true" aria-label="Watch on GitHub">Watch</a>
    <a class="github-button" href="https://github.com/OWASP/API-Security" data-icon="octicon-star" data-size="large" data-show-count="true" aria-label="Star on GitHub">Star</a>
 </div>

          <div class="sidebar" role="complementary">
    

    
    
       

  <div class='owasp-sidebar-top'>
    <strong>The OWASP<sup>&reg;</sup> Foundation</strong> works to improve the security of software through its community-led open source software projects,
     hundreds of chapters worldwide, tens of thousands of members, and by hosting local and global conferences.
</div>

  <h3 id="api-security-information">API Security Information</h3>

<p><span class="fa-stack fa-2x" title="Production Project">
  <i class="fas fa-circle fa-stack-2x" style="color:#800080"></i>
  <i class="fas fa-city fa-stack-1x fa-inverse"></i>
</span>
<img src="https://raw.githubusercontent.com/OWASP/www--site-theme/master/assets/images/common/owasp_documentation_project.svg?sanitize=true" alt="Documentation Project" /></p>

<p><i class="fas fa-toolbox" style="color:#233e81;"></i> Builders
<i class="fas fa-hammer" style="color:#233e81;"></i> Breakers
<i class="fas fa-shield-alt" style="color:#233e81;"></i> Defenders</p>

<p><a href="http://creativecommons.org/licenses/by-sa/4.0/"><img src="assets/images/by-sa.svg" alt="CC BY-SA 4.0" width="175px" /></a></p>

<h3 id="downloads-or-social-links">Downloads or Social Links</h3>

<ul>
  <li><a href="https://owasp.org/API-Security/editions/2023/en/0x00-header/">API Security Top 10 2023</a></li>
  <li><a href="https://owasp.org/API-Security/editions/2019/en/0x00-header/">API Security Top 10 2019</a> (<a href="https://owasp.org/API-Security/editions/2019/en/dist/owasp-api-security-top-10.pdf">PDF</a>)</li>
  <li><a href="https://cheatsheetseries.owasp.org/cheatsheets/GraphQL_Cheat_Sheet.html">GraphQL Cheat Sheet</a></li>
  <li><a href="https://github.com/OWASP/API-Security/discussions">GitHub Discussions</a></li>
  <li><a href="https://groups.google.com/a/owasp.org/d/forum/api-security-project">Mailing List</a></li>
</ul>

<h3 id="code-repository">Code Repository</h3>

<ul>
  <li><a href="https://github.com/OWASP/API-Security">GitHub</a></li>
</ul>

  <h3 id="leaders">Leaders</h3>

<ul>
  <li><a href="/cdn-cgi/l/email-protection#f396819689dd8a929f9c9db39c84928083dd9c8194">Erez Yalon</a></li>
  <li><a href="/cdn-cgi/l/email-protection#a7cec9c8c989d4cfccc2c3dee7c8d0c6d4d789c8d5c0">Inon Shkedy</a></li>
  <li><a href="/cdn-cgi/l/email-protection#433322362f2c6d302a2f3522032c342230336d2c3124">Paulo Silva</a></li>
</ul>

  <div class='owasp-sidebar-bottom'>
   <h3>Upcoming OWASP Global Events</h3>
   <div id='global-event-div'>

   </div>
</div>

<script data-cfasync="false" src="/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js"></script><script type="text/javascript">
   var events = [];
   $(function () {
      eventsyml = YAML.load('<https://owasp.org/assets/sitedata/events.yml>');

      $.each(eventsyml, function (index) {
         if (this.category == 'Global') {
            for (e in this.events) {
               events.push(this.events[e]);
            }
         }
      });

      if (events.length > 0) {
         var htmlstring = "<ul>";
         for (evnt in events) {
            if (events[evnt].url)
               htmlstring += '<li><a href="' + events[evnt].url
            else
               htmlstring += '<li><a href="https://owasp.org/events/'

            htmlstring += '" target="_blank rel="noopener">' + events[evnt].name + '</a>';

            if (typeof events[evnt].dates === 'undefined') {
               events[evnt].dates = 'TBA';
            }

            htmlstring += "<ul><li style='list-style-type: circle;margin-top: 0px;padding:0px;margin-left:16px;'>" + events[evnt].dates + "</li></ul></li>";
         }
         htmlstring += "</ul>";

         $("#global-event-div").html(htmlstring);
      }
   });
</script>

  <!--<div>
    <h3>OWASP News & Opinions</h3>
    <ul>
    	
    </ul>	
  </div>-->
</div>

      </div>
    </main>
    <footer>
  
  <section class="member">

  <script type="text/javascript">
    var members = [];
    var plat_indices = [];
    var gold_indices = [];
    var other_indices = [];

    function get_next_member(members, indexUsed){
      // random 6
      // 0 to 2 = Platinum (.2 > Other)
      // 3 to 4 = Gold (.1 > Other)
      // 5 = Other  
      member = null;
      chosenIndex = -1;
      var pick = Math.floor(Math.random() * 100);
      var randomIndex = -1;
      if(pick < 44){
        // pick a platinum member
        randomIndex = Math.floor(Math.random() * plat_indices.length);
        pIndex = plat_indices[randomIndex];
        cycleIndex = randomIndex
        while(chosenIndex == -1)
        {
          randomIndex++;
          if(indexUsed.indexOf(pIndex)== -1){
            chosenIndex = pIndex;

          }else if(randomIndex >= plat_indices.length){
            randomIndex = 0;

          }
          if (randomIndex == cycleIndex){ // we could not find a plat member not already in the list....
            break;
          }
        }
      }
      if (chosenIndex == -1 && pick < 77) {
        // pick a gold member
        randomIndex = Math.floor(Math.random() * gold_indices.length);
        pIndex = gold_indices[randomIndex];
        cycleIndex = randomIndex
        while(chosenIndex == -1)
        {
          randomIndex++;
          if(indexUsed.indexOf(pIndex)== -1){
            chosenIndex = pIndex;

          }else if(randomIndex >= gold_indices.length){
            randomIndex = 0;

          }
          if (randomIndex == cycleIndex){ // we could not find a plat member not already in the list....
            break;
          }
        }
      }
      if (chosenIndex == -1){
        // pick an other member
        randomIndex = Math.floor(Math.random() * other_indices.length);
        pIndex = other_indices[randomIndex];
        cycleIndex = randomIndex
        while(chosenIndex == -1)
        {
          randomIndex++;
          if(indexUsed.indexOf(pIndex)== -1){
            chosenIndex = pIndex;

          }else if(randomIndex >= other_indices.length){
            randomIndex = 0;

          }
          if (randomIndex == cycleIndex){ // we could not find a plat member not already in the list....
            break;
          }
        }
      }
      if(chosenIndex >= 0){
        member = members[chosenIndex];
        indexUsed.push(chosenIndex);
        var membertype = 'not a member';
        if(member.member && (member.membertype == 1 || !member.membertype))
          membertype = 'silver member';
        else if(member.member && member.membertype == 2)
          membertype = 'platinum member';
        else if(member.member && member.membertype == 3)
          membertype = 'gold member';
        else if(member.member && member.membertype)
          membertype = member.membertype;
      }
      return member;
    }

    $(function() {  
      var corp_members = YAML.load('https://owasp.org/assets/sitedata/corp_members.yml');
      $.each(corp_members, function (index) {
          index = members.push(this) - 1;  
          if(this.member && this.membertype == 3)
            gold_indices.push(index);
          else if (this.member && this.membertype == 2)
            plat_indices.push(index);
          else
            other_indices.push(index);
        });

        var indexUsed = [];

        var counter = 0;
        var numberOfImages = 9;
        var member = get_next_member(members, indexUsed);
        htmlstring = '<h2>Spotlight: ' + member["name"] + '</h2>';
        htmlstring += '<a href="'+ member["url"] + '" rel="sponsored nopener noreferrer" target="_blank" onclick="handleOutboundLinkClicks(event);"><img src="https://owasp.org' + member["image"] + '" alt="image" /></a>';
        htmlstring += '<p>' + member["description"] + '</p>';
        $(".member-spotlight").html(htmlstring);

        if(members.length > 0)
        {
          var htmlstring = "";
          while (counter < numberOfImages)
          {
            member = get_next_member(members, indexUsed)
            if (member)
            {
                counter++;
                htmlstring += '<a href="'+ member["url"] + '" class="member-logo" rel="sponsored noopener noreferrer" target="_blank" onclick="handleOutboundLinkClicks(event);"><img src="https://owasp.org' + member["image"] + '" alt="image"/></a>';
            }
          }

          $("#corp_member_div").html(htmlstring);

        }
    });
  </script>
  <div class="member-wrapper">
    <section class="member-spotlight">
    </section>
    <section class="member-list">
      <h2>Corporate Supporters</h2>
      <div id="corp_member_div">
      </div>
      <div class="member-cta">
        <a class="callout-link" href="https://owasp.org/supporters">Become a corporate supporter</a>
      </div>
    </section>
  </div>
</section>

  <section class="footer-wrapper">
    <section class="social">
<a href="https://github.com/OWASP/" aria-label="github organization" target="_blank" rel="noopener noreferrer"><i class="fa fa-lg fa-github"></i></a>
<a href="https://owasp.org/slack/invite" aria-label="slack group" target="_blank" rel="noopener noreferrer"><i class="fa fa-lg fa-slack"></i></a>
<a href="https://www.facebook.com/OWASPFoundation" aria-label="facebook group" target="_blank" rel="noopener noreferrer"><i class="fa fa-lg fa-facebook-square"></i></a>
<!-- Mastodon Icon will not load; FA instance is too old. Use the SVG instead-->
<a href="https://infosec.exchange/@owasp" aria-label="mastodon account" target="_blank" rel="me"><svg xmlns="http://www.w3.org/2000/svg" height="24" width="24" viewBox="0 0 448 512"><!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M433 179.1c0-97.2-63.7-125.7-63.7-125.7-62.5-28.7-228.6-28.4-290.5 0 0 0-63.7 28.5-63.7 125.7 0 115.7-6.6 259.4 105.6 289.1 40.5 10.7 75.3 13 103.3 11.4 50.8-2.8 79.3-18.1 79.3-18.1l-1.7-36.9s-36.3 11.4-77.1 10.1c-40.4-1.4-83-4.4-89.6-54a102.5 102.5 0 0 1 -.9-13.9c85.6 20.9 158.7 9.1 178.8 6.7 56.1-6.7 105-41.3 111.2-72.9 9.8-49.8 9-121.5 9-121.5zm-75.1 125.2h-46.6v-114.2c0-49.7-64-51.6-64 6.9v62.5h-46.3V197c0-58.5-64-56.6-64-6.9v114.2H90.2c0-122.1-5.2-147.9 18.4-175 25.9-28.9 79.8-30.8 103.8 6.1l11.6 19.5 11.6-19.5c24.1-37.1 78.1-34.8 103.8-6.1 23.7 27.3 18.4 53 18.4 175z"/></svg></a>
<!-- Twitter X Icon will not load; I suspect another dependency (Jekyll?) is using an older version that is conflicting. So use the SVG instead-->
<a href="https://twitter.com/owasp" aria-label="twitter account" target="_blank" rel="noopener noreferrer"><svg xmlns="http://www.w3.org/2000/svg" height="24" width="24" viewBox="0 0 512 512"><!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"/></svg></a>
<a href="https://www.linkedin.com/company/owasp/" aria-label="linkedin account" target="_blank" rel="noopener noreferrer"><i class="fa fa-lg fa-linkedin"></i></a>
<a href="https://www.youtube.com/user/OWASPGLOBAL" aria-label="youtube account" target="_blank" rel="noopener noreferrer"><i class="fa fa-lg fa-youtube-square"></i></a>
</section>

    <nav class="bot-nav" role="navigation" aria-label="secondary navigation">
      <ul>
        <li><a href="https://owasp.org/">HOME</a></li>
        <li><a href="https://owasp.org/projects/">PROJECTS</a></li>
        <li><a href="https://owasp.org/chapters/">CHAPTERS</a></li>
        <li><a href="https://owasp.org/events/">EVENTS</a></li>
        <li><a href="https://owasp.org/about/">ABOUT</a></li>
        <li><a href="https://owasp.org/www-policy/operational/privacy">PRIVACY</a></li>
        <li><a href="https://owasp.org/sitemap/">SITEMAP</a></li>
        <li><a href="https://owasp.org/contact/">CONTACT</a></li>
      </ul>
    </nav>
    <p class="disclaimer">
      OWASP, the OWASP logo, and Global AppSec are registered trademarks and AppSec Days, AppSec California, AppSec Cali, SnowFROC, OWASP Boston Application Security Conference, and LASCON are trademarks of the OWASP Foundation, Inc. Unless otherwise specified, all content on the site is Creative Commons Attribution-ShareAlike v4.0 and provided without warranty of service or accuracy. For more information, please refer to our <a href="https://policy.owasp.org/operational/general-disclaimer.html">General Disclaimer</a>. OWASP does not endorse or recommend commercial products or services, allowing our community to remain vendor neutral with the collective wisdom of the best minds in software security worldwide. Copyright 2025, OWASP Foundation, Inc.
    </p>
  </section>
</footer>

  </body>
</html>
