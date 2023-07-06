// global variables
var scale, global_path, process_short_list, process_root, ip, port, customer, hoverTimeout;
global_path = [{'id': '0', 'name' : 'Main Page'}];
scale = 1;
ip = 'localhost';
port = '8000';
customer = 'customer';

$(document).ready(() => {
  // run initial functions
  build_left_process();
  path_scroll();

  $('#display').mousedown(function(e){
    if (!$('#left').hasClass('hiddenLeft')){
      toggle_left();
    };
    $(this).addClass('dragging');
    $(this).find('*').addClass('dragging');
  }).mouseup(function(){
    $(this).removeClass('dragging');
    $(this).find('*').removeClass('dragging')
  }).draggable().focus();

  $(window).resize(() => {
    path_scroll();
  });
});

// get the short list of process data
function get_short_list(){
  return new Promise(function(resolve, reject){
    $.ajax({
      type: 'GET',
      url: 'http://' + ip + ':' + port + '/' + customer + '/',
      dataType: 'json',
      success: function(data){
        process_short_list = data;
        resolve(data);
      },
      error(e){
        reject(e);
      }
    });
  });
};

// get the full info list of a given process
function get_full_process_list(process_id){
  return new Promise(function(resolve, reject){
    $.ajax({
      type: 'GET',
      url: 'http://' + ip + ':' + port + '/' + customer + '/' + process_id,
      dataType: 'json',
      success: function(data){
        resolve(data);
      },
      error(e){
        reject(e);
      }
    });
  });
};

//------------------ Handle the processes -------------------
// display the list of processes in the left element
async function build_left_process(){
  // wait for api response
  await get_short_list();

  // varliables
  let processParent, title, div, button, icon, process, i;

  for (i = 0; i < process_short_list.length; i++){  
    process = process_short_list[i];
    processParent = $('<div>');
    div = $('<div>');
    title = $('<h3>');
    button = $('<div>');
    icon = $('<p>');

    title.attr({
      'onclick' : 'select_process("' + process.id + '")',
      'title' : 'Display process',
    }).append(process.name);
    button.attr({
      'class' : 'dropdownButton',
      'onclick' : 'toggle_dropdown_content("' + process.id + '")',
      'title' : 'List process content',
    }).append(icon);
    div.attr({
      'class' : 'processTop',
    }).append(title, button);
    processParent.attr({
      'class' : 'processParent',
      'id' : process.id,
    }).append(div);
    $('#left').append(processParent);
  };
};

// get full process
async function select_process(process_id, subsheet_id = ''){
  try {
      // wait for api response
      process_root = await get_full_process_list(process_id);

      console.log(process_root);

      // make the process 'selected' in the margin
      let processes, process;
      processes = $('.processParent');
      processes.removeClass('selected');
      process = $('#' + process_id);
      process.addClass('selected');

      if (subsheet_id == ''){
        // draw main page
        draw_main_page();
      } else {
        // draw subsheet
        draw_subsheet(subsheet_id);
      };

      // return success
      return('success');
  } catch {
    // return error
      return('error in selection of process');
  };
};

// get the the main page and all subsheets of a given process and add them to the margin
async function toggle_dropdown_content(process_id){
  let parent, p, local_process;
  parent = $('#' + process_id);
  p = parent.find('.dropdownButton p');
  // checking if the content is displayed
  if (!parent.hasClass('open')){
    // wait for api response
    local_process =  await get_full_process_list(process_id);
    // variables
    let div, title, subsheet_list, subsheet, i;

    subsheet_list = local_process.process.subsheetlist;
    div = $('<div>');
    div.attr({
      'class' : 'dropdownContent',
    }).hide();
    // main page
    title = $('<h4>');
    title.attr({
      'onclick' : 'empty_path();select_process("' + process_id + '")',
      'title' : 'Main Page',
    }).append('Main Page');
    div.append(title);
    // loop gjennom subsheets
    for (i = 0; i < subsheet_list.length; i++){
      subsheet = subsheet_list[i];
      title = $('<h4>');
      title.attr({
        'onclick' : 'empty_path();select_process("' + process_id + '","' + subsheet.id + '")',
        'title' : subsheet.name,
      }).append(subsheet.name);
      div.append(title);
    };
    parent.append(div);
    // slide down the content
    p.css('transform', 'rotateZ(0deg)');
    parent.find('.dropdownContent').slideDown(200);
  } else {
    // slide up the content
    p.css('transform', 'rotateZ(180deg)');
    parent.find('.dropdownContent').slideUp(200);
    // wait for the animation to end before removing the content
    setTimeout(function(){
      parent.find('.dropdownContent').remove();
    }, 250);
  };
  // toggle the class
  parent.toggleClass('open');
};

function convert_to_image(str, element){
  try{
    let img = $('<img>');

    let split = str.split(',');
    str = split[3];

    console.log(split[0] + ', ' + split[1] + ', ' + split[2]);

    // denne må gjøres bedre slik at flere format fungerer
    let start = 'data:image/png;base64,';
    str = start + str;

    img.attr({
      'src' : str,
      'width' : 100,
      'height' : 100,
    });
    element.append(img);
    return true;
  } catch {
    return false;
  }
};
//---------------------- SVG -----------------------
// draw an svg path from given start and end coordinates
function draw_line(x1, y1, x2, y2, arrow = true, id = null, onfalse = false){
  let line, midX, midY;
  midX = (x1 + x2)/2
  midY = (y1 + y2)/2
  
  line = document.createElementNS('http://www.w3.org/2000/svg','path');
  line.setAttribute('class','line');
  line.setAttribute('d', "M " + x1 + " " + y1 + " L " + midX + " " + midY + " L " + x2 + " " + y2);
  line.setAttribute('stroke', 'black');
  line.setAttribute('stroke-width', '1px');
  if (arrow === true){
    line.setAttribute('marker-mid', 'url(#arrow)');
  };
  if (id !== null){
    line.setAttribute('id', id);
  };
  if (onfalse === true){
    line.setAttribute('stroke-dasharray', "5,5");
  };
  $('svg').append(line);
  return line;
};

function draw_choice_lines(){
  let start, end, start_x, start_y, end_x, end_y, center_x, center_y;

  // get the size of svg element
  center_x = $('svg').outerWidth() / 2;
  center_y = $('svg').outerHeight() / 2;

  $('[stage_type=Choice]').each((i, start_element) => {
    start = $(start_element);
    end = $('.stage').filter('[id=' + start.attr('ontrue') + ']');
    start_x = start.position().left + start.outerWidth()/2 + center_x;
    start_y = start.position().top + start.outerHeight()/2 + center_y;
    end_x = end.position().left + end.outerWidth()/2 + center_x;
    end_y = end.position().top + end.outerHeight()/2 + center_y;
    draw_line(start_x, start_y, end_x, end_y);
  });
};

// get the positions of all stages with onsucces and draw lines from start to end stage
function draw_all_lines(remove_all = false){
  let svg, start, end, start_x, start_y, end_x, end_y, center_x, center_y;
  svg = $('svg');
  if (remove_all === true){
    svg.find('path').filter('.line').remove();
  } else {
    svg.find('path').filter('.line').filter(':not([id])').remove();
  };

  // get the size of svg element
  center_x = svg.outerWidth() / 2;
  center_y = svg.outerHeight() / 2;

  $('.stage').each((i, start_element) => {
    start = $(start_element);
    if (start.attr('onsuccess') !== undefined || start.attr('ontrue') !== undefined || start.attr('onfalse') !== undefined){
      $('.stage').each((j, end_element) => {
        end = $(end_element);
        if (start.attr('onsuccess') === end.attr('id') || start.attr('ontrue') === end.attr('id') || start.attr('onfalse') === end.attr('id')){
          let onfalse = start.attr('onfalse') === end.attr('id') ? true : false;
          start_x = start.position().left + start.outerWidth()/2 + center_x;
          start_y = start.position().top + start.outerHeight()/2 + center_y;
          end_x = end.position().left + end.outerWidth()/2 + center_x;
          end_y = end.position().top + end.outerHeight()/2 + center_y;
          draw_line(start_x, start_y, end_x, end_y, true, null, onfalse);
        };
      });
    };
    // handle choice start/end paths
    $('[stage_type=ChoiceStart]').each((i, start_element) => {
      start = $(start_element);
      end = $('[stage_type=ChoiceEnd]').filter('[groupid=' + start.attr('groupid') + ']');
      start_x = start.position().left + start.outerWidth()/2 + center_x;
      start_y = start.position().top + start.outerHeight()/2 + center_y;
      end_x = end.position().left + end.outerWidth()/2 + center_x;
      end_y = end.position().top + end.outerHeight()/2 + center_y;
      draw_line(start_x, start_y, end_x, end_y, false, start.attr('id'));
    });
  });
};

// draw line from edge of element
function draw_line_using_angles(start, end){
  let angle, outer_side, inner_side_start;
  
  outer_side = {
    'a': Math.abs(start.y - end.y),
    'b': Math.abs(start.x - end.x),
  };
  outer_side.c = Math.sqrt(outer_side.a*outer_side.a + outer_side.b*outer_side.b);

  angle = {
    'a': Math.asin(outer_side.a/outer_side.c) * (180/Math.PI),
    'c': 90,
  };
  angle.b = angle.c - angle.a;

  inner_side_start = {
    'b': start.w/2,
  };
  inner_side_start.c = inner_side_start.b/Math.sin(angle.b * (Math.PI/180));
  inner_side_start.a = Math.sqrt(inner_side_start.c*inner_side_start.c - inner_side_start.b*inner_side_start.b);

  console.log('A=' + angle.a + ': B=' + angle.b + ': C=' + angle.c);
  console.log('a=' + outer_side.a + ': b=' + outer_side.b + ': c=' + outer_side.c);
  console.log('a=' + inner_side_start.a + ': b=' + inner_side_start.b + ': c=' + inner_side_start.c);

  if (start.x > end.x && start.y > end.y){
    console.log('up left');
  } else if (start.x < end.x && start.y > end.y){
    console.log('up right');
  } else if (start.x > end.x && start.y < end.y){
    console.log('down left');
  } else if (start.x < end.x && start.y < end.y){
    console.log('down right');
  } else if (start.x === end.x && start.y > end.y){
    console.log('straight up');
  } else if (start.x === end.x && start.y < end.y){
    console.log('straight down');
  } else if (start.x > end.x && start.y === end.y){
    console.log('straight left');
  } else if (start.x < end.x && start.y === end.y){
    console.log('straight right');
  };
};

//---------------------- Draw Pages -----------------------
function draw_main_page(){
    // variables
    let stage_list, stage, i, choices;
    choices = {
      'items': new Array,
      'ids': new Array,
    };

    stage_list = process_root.process.stagelist;
    // draw the initial path
    empty_path();
    draw_path();
    empty_page();
  
    //draw stages
    for (i = 0; i < stage_list.length; i++) {
      stage = stage_list[i];
      if (stage.subsheetid === '') {
        switch(stage.type) {
          case 'Block':
            draw_block(stage, scale);
            break;
          case 'ChoiceStart':
            choices.ids.push(stage.id);
            choices.items.push(stage.choices);
            draw_stage(stage, scale);
            break;
          case 'ProcessInfo':
            draw_process_info(stage, scale);
            break;
          case 'SubSheetInfo':
            draw_subsheet_info(stage, scale);
            break;
          case 'Collection':
            draw_collection(stage, scale);
            break;
          default:
            draw_stage(stage, scale);
            break;
        };
      };
    };

    // Denne gjør at alle andre prosesser ikke fungerer
    /*
    try{
      let source = displayed_object.child_process.stage_list[15].initialvalue[2].value;
      convert_to_image(source, $('#displayCenter'));
    } catch {
      console.log('error with image');
    };*/

    resize_page();
    scroll_into_view();
    draw_all_lines(true);
    if (choices.ids.length > 0){
      for (i = 0; i < choices.ids.length; i++){
        draw_choices(choices.ids[i], choices.items[i], scale);
      };
    };
    hover_effect();
};

function draw_subsheet(subsheet_id, path = true){
    // variables
    let name, stage_list, stage, subsheet_list, i, choices;
    
    choices = {
      'items': new Array,
      'ids': new Array,
    };
  
    // find the subsheet
    subsheet_list = process_root.process.subsheetlist;
    name = 'Undefined';
    for (i = 0; i < subsheet_list.length; i++){
      if (subsheet_id == subsheet_list[i].id){
        name = subsheet_list[i].name;
      };
    };
  
    if (path === true){
      // draw the path
      edit_path(subsheet_id, name,);
    }
  
    // remove previous page and create new blank page
    empty_page();
  
    // stage list
    stage_list = process_root.process.stagelist;
  
    // draw stages
    for (i = 0; i < stage_list.length; i++) {
      stage = stage_list[i];
      if (stage.subsheetid !== subsheet_id) {
        continue; // Skip this stage if subsheetid doesn't match
      };
      switch(stage.type) {
        case 'Block':
          draw_block(stage, scale);
          break;
        case 'ChoiceStart':
          choices.ids.push(stage.id);
          choices.items.push(stage.choices);
          draw_stage(stage, scale);
          break;
        case 'ProcessInfo':
          draw_process_info(stage, scale);
          break;
        case 'SubSheetInfo':
          draw_subsheet_info(stage, scale);
          break;
        case 'Collection':
          draw_collection(stage, scale);
          break;
        default:
          draw_stage(stage, scale);
          break;
      };
    };
    
    resize_page();
    scroll_into_view();
    draw_all_lines(true);
    if (choices.ids.length > 0){
      for (i = 0; i < choices.ids.length; i++){
        draw_choices(choices.ids[i], choices.items[i], scale);
      };
    };
    hover_effect();
    //control_drag($('#display'), $('#displayParent'));
    //detect_display_scroll();
};

//---------------------- Draw Stages ----------------------
function draw_stage(stage, scale){
  let element, p;
  element = $('<div>');

  p = $('<p>');
  if (stage.type === 'Anchor'){
    
  } else if (stage.type === 'Note'){
    p.append(stage.narrative);
  } else {
    p.append(stage.name)
  };

  element.attr({
    'class' : 'stage',
    'id' : stage.id,
    'onsuccess' : stage.onsuccess,
    'ontrue' : stage.ontrue,
    'onfalse' : stage.onfalse,
    'groupid' : stage.groupid,
    'stage_type' : stage.type,
  }).css({
    'left' : stage.x * scale,
    'top' : stage.y * scale,
    'color' : stage.fontcolor,
    'font-size' : stage.fontsize * scale,
  }).append(p);

  if (stage.w !== null && stage.w !== null){
    element.css({
      'width' : stage.w * scale,
      'height' : stage.h * scale,
    });
  };

  if (stage.type === 'SubSheet'){
    element.attr('onclick', 'draw_subsheet("' + stage.processid + '")');
  } else if (stage.type === 'Data'){
    element.css({
      'width' : element.outerWidth() * 0.8,
      'height' : element.outerHeight() * 0.9,
    });
  };

  $('#displayCenter').append(element);

  if (stage.w === null && stage.h === null) {
    element = $('#displayCenter').find('#' + stage.id);
    element.css({
      'width' : element.outerWidth() * scale,
      'height' : element.outerHeight() * scale,
    });
  };

  if (stage.type !== 'Anchor'){
    draw_hover_element(stage);
  };
};

function draw_choices(id, choices, scale){
  let i, path, point, element, center_x, center_y;
  path = document.getElementById(id);

  // get the size of svg element
  center_x = $('svg').outerWidth() / 2;
  center_y = $('svg').outerHeight() / 2;

  if (path !== undefined){
    for (i = 0; i < choices.length; i++){
      point = {
        'x': path.getPointAtLength(choices[i].distance).x - center_x,
        'y': path.getPointAtLength(choices[i].distance).y - center_y,
      };
      element = $('<div>');
      element.attr({
        'name' : choices[i].name,
        'id' : id + choices[i].name,
        'class' : 'stage',
        'ontrue' : choices[i].ontrue,
        'stage_type' : 'Choice',
        'title' : 'Choice: ' + choices[i].name,
      }).css({
        'left' : point.x,
        'top' : point.y * scale,
      });
      $('#displayCenter').append(element);

      // hover element
    };
    draw_choice_lines();
  } else {
    console.log('choice path not found');
  };
};

function draw_subsheet_info(stage, scale){
  let element, p, i, subsheet;
  element = $('<div>');
  element.attr({
    'class' : 'stage',
    'id' : stage.id,
    'onsuccess' : stage.onsuccess,
    'stage_type' : stage.type,
  }).css({
    'left' : stage.x * scale,
    'top' : stage.y * scale,
    'width' : stage.w * scale,
    'height' : stage.h * scale,
  });

  // find the subsheet
  for (i = 0; i < process_root.process.subsheetlist.length; i++){
    subsheet = process_root.process.subsheetlist[i] ? process_root.process.subsheetlist[i].id == stage.id : undefined;
  };

  p = $('<p>');
  p.css({
    'border-bottom' : '1px solid black',
    'padding' : '0 2px',
  }).append(subsheet.name);
  element.append(p);

  $('#displayCenter').append(element);
  draw_hover_element(stage);
};

function draw_process_info(stage, scale){
    let element, p;
    element = $('<div>');
    element.attr({
      'class' : 'stage',
      'id' : stage.id,
      'onsuccess' : stage.onsuccess,
      'stage_type' : stage.type,
    }).css({
      'left' : stage.x * scale,
      'top' : stage.y * scale,
      'width' : stage.w * scale,
      'height' : stage.h * scale,
    });

    p = $('<p>');
    p.css({
      'border-bottom' : '1px solid black',
      'padding' : '0 2px',
    }).append(process_root.info.name);
    element.append(p);

    p = $('<p>');
    p.css({
      'padding' : '0 2px',
    }).append(process_root.process.narrative);
    element.append(p);

    p = $('<p>');
    p.css({
      'position' : 'absolute',
      'bottom' : '0',
      'left' : '0',
      'border-top' : '1px solid black',
      'padding' : '0 2px',
    }).append('Created: ' + process_root.info.user_created_by + ', at ' + process_root.info.created);
    element.append(p);

    $('#displayCenter').append(element);
    draw_hover_element(stage);
};

function draw_block(stage, scale){
    let element, p;

    p = $('<p>');
    p.attr({
      'class' : 'blockLabel',
      'stage_type' : 'BlockLabel',
    }).css({
      'left' : stage.x * scale,
      'top' : stage.y * scale,
      'color' : stage.font_color,
      'font-size' : stage.font_size,
    }).append(stage.name);

    element = $('<div>');
    element.attr({
      'class' : 'stage',
      'id' : stage.id,
      'onsuccess' : stage.onsuccess,
      'stage_type' : stage.type,
    }).css({
      'left' : (stage.x + stage.w/2) * scale,
      'top' : (stage.y + stage.h/2) * scale,
      'width' : stage.w * scale,
      'height' : stage.h * scale,
    });
    $('#displayCenter').append(element);
    $('#displayCenter').append(p);
};

function draw_collection(stage, scale){
    let element, p, child;

    p = $('<p>');
    p.append(stage.name);

    child = $('<div>');
    child.append(p);

    element = $('<div>');
    element.attr({
      'class' : 'stage',
      'id' : stage.id,
      'onsuccess' : stage.onsuccess,
      'stage_type' : stage.type,
    }).css({
      'left' : stage.x * scale,
      'top' : stage.y * scale,
      'width' : stage.w * 0.8 * scale,
      'height' : stage.h * 0.9 * scale,
    }).append(child);
    $('#displayCenter').append(element);

    draw_hover_element(stage);
};

function draw_hover_element(stage){
  let hover_element, p, hover_x, hover_y, element, to_stage, i, j;

  hover_x = $('#' + stage.id).position().left;
  hover_y = $('#' + stage.id).position().top + $('#' + stage.id).outerHeight() + 1;

  hover_element = $('<div>');
  hover_element.attr({
    'class' : 'hover',
    'id' : stage.id,
  }).css({
    'top' : hover_y + 'px',
    'left' : hover_x + 'px',
  });

  element = $('<p>');
  p = $('<p>').css({'font-weight': 'bold', 'display': 'inline-block'}).append('Type:');
  element.attr('class', 'stageType').append(p, ' ' + stage.type);
  hover_element.append(element);

  if (stage.type === 'ChoiceStart'){
    element = $('<p>');
    to_stage = process_root.process.stagelist.filter(function(currentObj){return stage.groupid === currentObj.groupid && stage !== currentObj});
    p = $('<p>').css({'font-weight': 'bold', 'display': 'inline-block'}).append('Otherwise:');
    element.attr('id', 'groupid').append(p, ' ' + to_stage[0].name).hide();
    hover_element.append(element);
  };

  if (stage.onsuccess){
    element = $('<p>');
    p = $('<p>').css({'font-weight': 'bold', 'display': 'inline-block'}).append('Success:');
    to_stage = process_root.process.stagelist.filter(function(currentObj){return stage.onsuccess === currentObj.id});
    while (to_stage[0].type === 'Anchor'){
      let temp_stage = to_stage[0];
      to_stage = process_root.process.stagelist.filter(function(currentObj){return temp_stage.onsuccess === currentObj.id});
    };
    element.attr('id', 'onsuccess').append(p, ' ' + to_stage[0].name).hide();
    hover_element.append(element);
  };

  if (stage.ontrue){
    element = $('<p>');
    p = $('<p>').css({'font-weight': 'bold', 'display': 'inline-block'}).append('True:');
    to_stage = process_root.process.stagelist.filter(function(currentObj){return stage.ontrue === currentObj.id});
    while (to_stage[0].type === 'Anchor'){
      let temp_stage = to_stage[0];
      to_stage = process_root.process.stagelist.filter(function(currentObj){return temp_stage.onsuccess === currentObj.id});
    };
    element.attr('id', 'ontrue').append(p, ' ' + to_stage[0].name).hide();
    hover_element.append(element);
  };

  if (stage.onfalse){
    element = $('<p>');
    p = $('<p>').css({'font-weight': 'bold', 'display': 'inline-block'}).append('False:');
    to_stage = process_root.process.stagelist.filter(function(currentObj){return stage.onfalse === currentObj.id});
    while (to_stage[0].type === 'Anchor'){
      let temp_stage = to_stage[0];
      to_stage = process_root.process.stagelist.filter(function(currentObj){return temp_stage.onsuccess === currentObj.id});
    };
    element.attr('id', 'onfalse').append(p, ' ' + to_stage[0].name).hide();
    hover_element.append(element);
  };

  if (stage.narrative){
    element = $('<p>');
    p = $('<p>').css('font-weight', 'bold').append('Narrative:');
    element.attr('id', 'narrative').append(p, stage.narrative).hide();
    hover_element.append(element);
  };

  if (stage.datatype){
    element = $('<p>');
    p = $('<p>').css({'font-weight': 'bold', 'display': 'inline-block'}).append('Datatype:');
    element.attr('id', 'datatype').append(p, ' ' + stage.datatype).hide();
    hover_element.append(element);
  };

  if (stage.collectioninfo && stage.collectioninfo.length > 0){
    p = $('<p>').css('font-weight', 'bold').append('Collection info:');
    element = $('<p>');
    element.attr('id', 'collectioninfo').append(p);
    for (i = 0; i < stage.collectioninfo.length; i++){
      if (stage.collectioninfo[i].type){element.append('Type: ' + stage.collectioninfo[i].type)};
      if (stage.collectioninfo[i].name){element.append(', Name: ' + stage.collectioninfo[i].name)};
      if (stage.collectioninfo[i].value){element.append(', Value: ' + stage.collectioninfo[i].value)};
      element.append($('<br>'));
    };
    element.hide();
    hover_element.append(element);
  };

  if (stage.initialvalue && stage.initialvalue.length > 0){
    p = $('<p>').css('font-weight', 'bold').append('Initialvalue:');
    element = $('<p>');
    element.attr('id', 'initialvalue').append(p);
    for (i = 0; i < stage.initialvalue.length; i++){
      element.append('Row ' + (i + 1) + '- ');
      for (j = 0; j < stage.initialvalue[i].length; j++){
        if (stage.initialvalue[i][j].type){element.append('Type: ' + stage.initialvalue[i][j].type)};
        if (stage.initialvalue[i][j].name){element.append(', Name: ' + stage.initialvalue[i][j].name)};
        if (stage.initialvalue[i][j].value){element.append(', Value: ' + stage.initialvalue[i][j].value)};
        element.append($('<br>'));
      };
    };
    element.hide();
    hover_element.append(element);
  };

  if (stage.inputs){
    element = $('<p>');
    p = $('<p>');
    p.css('font-weight', 'bold').append('Inputs: ');
    element.attr('id', 'inputs').append(p);
    for (i = 0; i < stage.inputs.length; i++){
      if (stage.inputs[i].type){element.append('Type: ' + stage.inputs[i].type)};
      if (stage.inputs[i].friendlyname){element.append(', Name: ' + stage.inputs[i].friendlyname)} else {element.append(', Name: ' + stage.inputs[i].name)};
      if (stage.inputs[i].stage){element.append(', Stage: ' + stage.inputs[i].stage)};
      if (stage.inputs[i].expr){element.append(', Expr: ' + stage.inputs[i].expr)};
      element.append($('<br>'));
    };
    element.hide();
    hover_element.append(element);
  };

  if (stage.outputs){
    element = $('<p>');
    p = $('<p>');
    p.css('font-weight', 'bold').append('Outputs: ');
    element.attr('id', 'outputs').append(p);
    for (i = 0; i < stage.outputs.length; i++){
      if (stage.outputs[i].type){element.append('Type: ' + stage.outputs[i].type)};
      if (stage.outputs[i].friendlyname){element.append(', Name: ' + stage.outputs[i].friendlyname)} else {element.append(', Name: ' + stage.outputs[i].name)};
      if (stage.outputs[i].stage){element.append(', Stage: ' + stage.outputs[i].stage)};
      element.append($('<br>'));
    };
    element.hide();
    hover_element.append(element);
  };

  element = $('<div>');
  element.attr({
    'class' : 'button',
    'onclick' : 'toggle_expand_hover("' + stage.id + '")',
  }).append('More...');
  hover_element.append(element);

  $('#displayCenter').append(hover_element);
};

//-------------------- Toggle Functions --------------------
function toggle_expand_hover(stage_id){
  let hover_element;
  hover_element = $('.hover').filter('#' + stage_id);
  if (hover_element.hasClass('expanded')){
    // hide all, and show selected elements inside hover
    hover_element.find('*').hide();
    hover_element.find('.stageType').show().find('*').show();
    hover_element.find('.button').show().empty().append('More...');
  } else {
    // show all elements inside hover
    hover_element.find('*').show();
    hover_element.find('.button').empty().append('Less...');
  }
  // resize the hover element
  hover_element.css('height', 'fit-content').toggleClass('expanded');
};

function toggle_settings(){
  $('#settings').toggleClass('showSettings');
};

function toggle_info(){
  let info, wrapper, container;
  info = $('#info'), wrapper = $('#wrapper'), container = $('#container');
  if (info.hasClass('hiddenInfo')){
    // show the info
    info.removeClass('hiddenInfo');
    wrapper.removeClass('hiddenWrapper');
    setTimeout(function(){
      container.removeClass('hiddenContainer');
    }, 400);
  } else {
    // hide the info
    setTimeout(function(){
      info.addClass('hiddenInfo');
    }, 1000);
    container.addClass('hiddenContainer');
    wrapper.addClass('hiddenWrapper');
  };
};

function toggle_detail(type){
  let detail = $('.detail').filter('#' + type);
  let button = detail.find('.icon');
  detail.toggleClass('expanded');
  button.toggleClass('rotate');
};

function toggle_search(){
  // declearing variables
  let input = $('#inputDiv');
  if (input.hasClass('hidden')){
    input.slideDown(200);
    input.find('input').focus();
  } else {
    input.slideUp(200);
    input.find('input').val('');
    search();
  };
  input.toggleClass('hidden');
};

function toggle_left(){
  $('#left').toggleClass('hiddenLeft')
  $('#toggleLeftButton').toggleClass('hiddenLeftButton');
};

//------------------------ Other ------------------------
// remove all stages
function empty_page(){
  $('#displayCenter').empty();
};

// empty and reset the path
function empty_path(){
  global_path = [{'id': '0', 'name' : 'Main Page'}];
  $('#path').empty();
};

// add or remove items in the path
function edit_path(page_id, name, index = ''){
  // updating the list
  if (index == ''){
    // adding new list-item
    global_path.push({'id' : page_id, 'name' : name});
  } else {
    // removing all list items after index
    global_path.length = parseInt(index) + 1;
  };
  // last draw the new path
  draw_path();
};

// draw the path
function draw_path(){
  // variables
  let path_div, btn_element, p_element, i;
  // empty the entire path-element
  path_div = $('#path');
  path_div.empty();

  // loop through the path list
  for (i = 0; i < global_path.length - 1; i++){
    // create a button for each entry
    btn_element = $('<button>');
    btn_element.attr({
      'class' : 'pathButton',
      'title' : 'Go to ' + global_path[i].name,
    });
    
    // if the id of the page is 0 it is the main page
    if (global_path[i].id == '0'){
      btn_element.attr({
        'onclick' : 'edit_path("", ""," ' + i + '"); draw_main_page()',
      });
    } else {
      btn_element.attr({
        'onclick' : 'edit_path("", "", "' + (i - 1) + '"); draw_subsheet("' + global_path[i].id + '")',
      });
    };
    // element text
    p_element = $('<p>');
    p_element.append(global_path[i].name);

    btn_element.append(p_element);
    path_div.append(btn_element);
  };

  // adding the current page to the label
  $('#pageLabel').empty().attr({
    'page_id' : global_path[global_path.length - 1].id,
  }).append(global_path[global_path.length - 1].name);
};

// horizontal scroll for the path
function path_scroll(){
  let element, length, position;
  element = $('#path');
  length = element.prop('scrollWidth') - element.outerWidth();
  position = 0;
  element.bind('wheel', (e) => {
    if (position <= length && position >= 0) {
      if (e.originalEvent.wheelDelta / 120 > 0) {
        position -= 20;
        element.scrollLeft(position);
      } else {
        position += 20;
        element.scrollLeft(position);
      };
    } else if (position > length){
      position = length - 20;
    } else if (position < 0){
      position = 20;
    };
  });
  element.scroll(() => {
    position = element.scrollLeft();
  });
};

// take the scale from the input element and draw the stages
function change_scale(){
  scale = parseInt($('#scaleInput').val())/5;
  let label = $('#pageLabel');
  if (label.attr('page_id') !== '0'){
    draw_subsheet(label.attr('page_id'), false);
  } else {
    draw_main_page();
  };
};

// set the value of the input element to 5 and draw the stages
function reset_scale(){
  let slider = $('#scaleInput');
  slider.val(5);
  change_scale();
};

// change the size of the page to make the stages fit
function resize_page(){
  let x = y = 0, display, stage, left, top;
  display = $('#display');
  display.find('.stage').each(function(e, elem){
    stage = $(elem);
    left = stage.position().left;
    top = stage.position().top;
    if (left < 0 && Math.abs(left) > x){
      x = Math.abs(left);
    } else if (left > 0 && (left + stage.outerWidth()) > x){
      x = left + stage.outerWidth();
    };
    if (top < 0 && Math.abs(top) > y){
      y = Math.abs(top);
    } else if (top > 0 && (top + stage.outerHeight()) > y){
      y = top + stage.outerHeight();
    };
  });
  x = Math.ceil(x / 10) * 10;
  y = Math.ceil(y / 10) * 10;
  display.css({
    'width' : x*2 + 100,
    'height' : y*2 + 100,
  });
};

// filter the processes in the margin
function search(){
  let search = $('#searchInput').val().toLowerCase();

  $('.processParent').each((i, element) => {
    let name = $(element).find('.processTop h3').text().toLowerCase();
    if (name.indexOf(search) != -1){
      $(element).stop().show();
    } else {
      $(element).stop().hide();
    };
  });
};

// hover effect on the stages
function hover_effect(){
  let stage, hover;
  $('.stage').mouseenter(function() {
    stage = $(this);
    clearTimeout(hoverTimeout);
    hoverTimeout = setTimeout(function(){
      hover = $('#displayCenter').find('.hover').filter('#' + stage.attr('id'));
      hover.addClass('showHover').stop().slideDown(200);
    }, 500);
  });
  $('.stage').mouseleave(function() {
    clearTimeout(hoverTimeout);
    hover = $('#displayCenter').find('.hover').filter('#' + $(this).attr('id'));
    hover.removeClass('showHover').stop().slideUp(100);
  });
  $('.hover').mouseenter(function() {
    $(this).addClass('showHover').stop().slideDown(200);
  });
  $('.hover').mouseleave(function() {
    $(this).removeClass('showHover').stop().slideUp(100);
  });
};

function control_drag(display, window_elem){
  let sides, window, transition;

  window = {
    'width' : window_elem.outerWidth(),
    'height' : window_elem.outerHeight(),
  };

  display.draggable({
    start: function(event, ui){
      transition = display.css('transition');
      display.css({
        'transition' : 'none',
      });
    },
    stop: function(event, ui){
      sides = {
        'left' : display.position().left,
        'right' : display.position().left + display.outerWidth(),
        'top' : display.position().top,
        'bottom' : display.position().top + display.outerHeight(),
      };

      display.css({
        'transition' : transition,
      });

      if (sides.left > 0){
        display.css({
          'left' : 0,
        });
      } else if (sides.right < window.width){
        display.css({
          'left' : window.width - display.outerWidth(),
        });
      };
      if (sides.top > 0){
        display.css({
          'top' : 0,
        });
      } else if (sides.bottom < window.height){
        display.css({
          'top' : window.height - display.outerHeight(),
        });
      };
    }
  });
};

function detect_display_scroll(){
  let parent, display, transition, sides, window;
  parent = $('#displayParent');
  display = $('#display');

  transition = display.css('transition');

  window = {
    'width' : parent.outerWidth(),
    'height' : parent.outerHeight(),
  };

  parent.bind('wheel', (e) => {
    sides = {
      'left' : display.position().left,
      'right' : display.position().left + display.outerWidth(),
      'top' : display.position().top,
      'bottom' : display.position().top + display.outerHeight(),
    };

    // vertical scroll
    if (e.originalEvent.deltaY !== 0 /* check if display sides are inside the window */){
      display.css('transition', 'none');
      if (e.originalEvent.deltaY / 120 < 0 && sides.top < 0) {
        display.css('top', '+=5');
      } else if (e.originalEvent.deltaY / 120 > 0 && sides.bottom > window.height){
        display.css('top', '-=5');
      };
    };
    // horizontal scroll
    if (e.originalEvent.deltaX !== 0 /* check if display sides are inside the window */){
      display.css('transition', 'none');
      if (e.originalEvent.deltaX / 120 < 0 && sides.left < 0) {
        display.css('left', '+=5');
      } else if (e.originalEvent.deltaX / 120 > 0 && sides.right > window.width) {
        display.css('left', '-=5');
      };
    };
    display.css('transition', transition);
  });
};

function scroll_into_view(){
  let display, size, sides, x = y = 0, stage, scrollPos;

  display = $('#display');
  size = {
    'x' : display.outerWidth(),
    'y' : display.outerHeight(),
    'centerX' : display.outerWidth()/2,
    'centerY' : display.outerHeight()/2,
  };

  // find minx and miny
  display.find('.stage').each(function(i, elem){
    stage = $(elem);
    sides = {
      'left' : stage.position().left,
      'top' : stage.position().top,
    };
    if (sides.left < x){
      x = sides.left;
    };
    if (sides.top < y){
      y = sides.top;
    };
  });

  // find the relative position stage/display
  scrollPos = {
    'x' : size.centerX - Math.abs(x),
    'y' : size.centerY - Math.abs(y),
  };
  display.css({
    'left' : -scrollPos.x + 100,
    'top' : -scrollPos.y + 100,
  });

};