var timeline = (function(){
  // Declare variables
  var dotWidth = 20;
  var wrapper = $(".timeline-wrapper").eq(0);
  var showDay = 3; //set day to current day
  var firstDataReceived = false;

  function init(){
    // Run these functions directly when the pages is loaded
    appendToWrapper();
    setMargin();
    events();
    addTitle();
    addDayButtons();
  }


  function addTitle(){
    var title = $("<span />", {
      class: "data-title",
      html: "DOOR DETECTION | <span>times</span>"
    });

    wrapper.before(title);
  }

  function addDayButtons(){
    var dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var now = new Date();
    var title = $("span.data-title");
    var selectDay = $("<select />", {
      class: "select-day form-control",
      name: "select"
    });

    for(var i = 0; i < 7; i++){
      var day = now.getDay();
      now.setDate(now.getDate()-1);
      var option = $("<option />", {
        value: i,
        html: dayNames[day]
      });

      if(i === showDay){
        option.attr("selected", "true");
      }

      selectDay.append(option);
    }

    title.after(selectDay);

    selectDay.on("change", function(){
      showDay = $(this).val();
      if(firstDataReceived){
        colorDots();
      }
    });

  }

  function appendToWrapper(){
    // Append all circles to wrap_dots and append that with hr to the wrapper
    var wrapDots = $("<div/>", {
      id: "wrap_dots"
    });
    var hr = $("<hr />");

    for(var i = 0; i < 24; i++){
      wrapDots.append("<div class='dot'><span>" + i + "</span></div>");
    }
    wrapper.append(hr, wrapDots);
  }

  function setMargin(){
    var margin = (wrapper.width()-100)/ 23.5 - dotWidth;
    var dots = $(".dot");
    dots.each(function(key, value){
      $(value).css("margin-left", margin + "px");
    });
    dots.eq(0).css("margin-left", "50px");
  }

  function events(){
    $(window).on("resize", function(){
      setMargin();
    });
  }

  function receiveData(){
    firstDataReceived  = true;
    colorDots();
  }

  function colorDots(){
    var $dots = $(".dot");

    for(var i = 0; i < data.countHour[showDay].length; i++){
      switch(data.countHour[showDay][i]){
        case 0:
          $dots.eq(i).removeClass("green yellow red colored");
          break;
        case 1:
        case 2:
          $dots.eq(i).removeClass("green yellow red colored");
          $dots.eq(i).addClass("green colored");
          break;
        case 3:
        case 4:
          $dots.eq(i).removeClass("green yellow red colored");
          $dots.eq(i).addClass("yellow colored");
          break;
        default:
          $dots.eq(i).removeClass("green yellow red colored");
          $dots.eq(i).addClass("red colored");
          break;
      }
    }
    // Add event listener
    addEventListeners();
  }

  function addEventListeners(){
    $(".colored").unbind().hover(function(e){
      expandDot(e);
    }, function(e){
      minifyDot(e);
    });

    $(".colored").on("click", function(e){
      expandDot(e);
    });
  }

  function expandDot(e){
    if(!e.target.classList.contains("colored")){
      return false;
    }
    $(e.target)
      .css("transform", "scale(4)")
      .css("z-index", "10")
      .find("span").css("display", "inline-block");

    addDots(e);
  }

  function minifyDot(e){
    var x = $(e.target);
    if(!e.target.classList.contains("colored")){
      x = $(e.target).parents().find(".colored");
    }
    x
      .css("transform", "scale(1)")
      .css("z-index", "1")
      .find("span").css("display", "none")
      .end()
      .find(".small_dot").remove();

  }

  function addDots(e){
    var positions = [];
    var hour = $(e.target).find("span").html();
    var minutes = [];
    var count = data.dataHour[showDay][hour].length;
    data.dataHour[showDay][hour].forEach(function(el, i){
      minutes[i] = el.getMinutes();
    });

    // In case mouseout fails, prevent adding items a second time
    if($(e.target).find(".small_dot").length > 0){
      return false;
    }

    // Define coordinates for the smaller dots
    var radius = 16;
    var cos = Math.cos((30/180)*Math.PI);
    positions = [[1, 0], [cos, 0.5], [0.5, cos], [0, 1], [-0.5, cos],
                [-cos, 0.5], [-1,0], [-cos, -0.5], [-0.5, -cos], [0, -1],
                [0.5, -cos], [cos, -0.5],[1, 0], [cos, 0.5], [0.5, cos], 
                [0, 1], [-0.5, cos], [-cos, 0.5], [-1,0], [-cos, -0.5], 
                [-0.5, -cos], [0, -1], [0.5, -cos], [cos, -0.5]];


    minutes.forEach(function(el, i){
      var offsetParent = $(e.target).offset();
      var div = $("<div class='small_dot'><p>" + el + "</p></div>").fadeIn(300);

      div
        // scale to 0.25
        .css("transform", "scale(0.25)")
        .css("position", "absolute")
        .appendTo($(e.target))
        .offset({top: offsetParent.top+(26/4) - radius*positions[i][0], left: offsetParent.left+(26/4) + radius*positions[i][1] });
    });

  }



  return {
    init: init,
    receiveData: receiveData,
    day: showDay,
    setMargin: setMargin
  };
})();


var data = (function(){
  var dataDay = [];
  var dataHour = [];
  var countDay = [];
  var countHour = [];
  var now = new Date();

  function init(){
    // Start everything and update every x seconds
    queue();
    var interval = setInterval(queue, 30000);
  }

  function queue(){
    $.when(getData()).then(function(data){
      sortPerDate(data);
      countPerDate();
      sortPerHour();
      countPerHour();
      timeline.receiveData();
    });
  }

  function getData(){
    // Get data from API
    var url = "https://arduino-logger-chart.herokuapp.com/getData?random=" + Math.random();

    return $.getJSON(url);
  }

  function sortPerDate(data){
    // Make array with dates of last 7 days
    var date = now.getDate();
    var dates = [];
    for(var k = 0; k < 7; k++){
      var day = new Date();
      day.setDate(date-k);
      dates.push(day);
      dataDay[k] = [];
    }

    // Put data in dataDay sorted per date
    for(var i = 0; i < data.length; i++){
      for(var j = 0; j < dates.length; j++){
        var x = new Date(data[i]);
        if(x.getDate() === dates[j].getDate()){
          dataDay[j].push(x);
        }
      }
    }
  }

  function countPerDate(){
    // Count how many per day
    for(var i = 0; i < dataDay.length; i++){
      countDay[i] = dataDay[i].length;
    }
  }

  function sortPerHour(){

    for(var i = 0; i < dataDay.length; i++){
      dataHour[i] = [];
      for(var x = 0; x < 24; x++){
        dataHour[i][x] = [];
      }
      for(var j = 0; j < dataDay[i].length; j++){
        for(var k = 0; k < 24; k++){
          if(dataDay[i][j].getHours() === k){
            dataHour[i][k].push(dataDay[i][j]);
          }
        }
      }
    }
  }

  function countPerHour(){
    for(var i = 0; i < dataHour.length; i++){
      countHour[i] = [];
      for(var j  = 0; j < dataHour[i].length; j++){
        countHour[i][j] = dataHour[i][j].length;
      }
    }
  }

  return {
    init: init,
    dataDay: dataDay,
    dataHour: dataHour,
    countDay: countDay,
    countHour: countHour
  };
})();

timeline.init();
data.init();