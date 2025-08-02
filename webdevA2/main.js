// JS VERSION : use esversion 6 (for template literals)

// dictionary to store page classes
let available_pages = {};
// variable to check when user has interacted with the document, otherwise error will throw when audio plays on hover
let user_interacted = false;

// event listener to listen for interaction with document, add 'once' into options parameter to remove listener after interacted 
document.addEventListener('click', function() {
    user_interacted = true;
}, { once: true });

//******************************************************************************
// *************************** GENERIC FUNCTIONS ***************************
//******************************************************************************

function remove_class(element,classname) {
    if (element.classList.contains(classname)) {
        element.classList.remove(classname);
        // force reflow (layout flush in the brower), accesses offsetwidth just to refresh browser, void to ensure no value is changed
        void element.offsetWidth;
    }
}

function add_class(element,classname) {
    element.classList.add(classname);
}

function replace_class(element,removing_class,adding_class) {
    remove_class(element,removing_class);
    add_class(element,adding_class);
}

function play_sound(sound_src){
    // only play if user has interacted with the document or else it will throw an error
    if (user_interacted) {
        let sound = new Audio(sound_src);
        sound.play();
    }
}

function get_random_int(min,max){
    // floor it to get a whole number
    return Math.floor(Math.random() * (max - min) + min);
}

function is_inside_element(element_check, bounding_box) {
    // get the 4 points of both elements
    const innerRect = element_check.getBoundingClientRect();
    const outerRect = bounding_box.getBoundingClientRect();

    // compare the points and only return if all 4 innerrect points are within the outerrect
    return (
        innerRect.top >= outerRect.top &&
        innerRect.left >= outerRect.left &&
        innerRect.bottom <= outerRect.bottom &&
        innerRect.right <= outerRect.right
    );
}

//******************************************************************************
// *************************** PAGE CLASS ***************************
//******************************************************************************

class page {
    constructor(name) {
        // obj variables
        this.page_name = name;
        this.button = null;
        this.article = null;
        this.visible = false;
    }

    // page method to add element to article and button vars
    link(article_id, button_id) {
        this.article = document.getElementById(article_id);
        this.button = document.getElementById(button_id);
    }

    change_visibility(visibility) {
        // change visibility value and change display type
        this.visible = visibility;
        if (visibility) {
            this.article.style.display = "block";
            replace_class(this.button,"interactive_button","selected_button");
        } else {
            replace_class(this.button,"selected_button","interactive_button");
            this.article.style.display = "none";
        }
    }
}

//******************************************************************************
// *************************** BUTTON CLASS ***************************
//******************************************************************************

// class for button
class button {

    // function to set text vars
    set_texts(enabled_text, disabled_text) {
        this.enabled_text = enabled_text;
        this.disabled_text = disabled_text;
        // first time, always disabled (not activated)
        this.button.innerHTML = disabled_text;
    }

    constructor(button, callback_function) {
        // activation bool check
        this.activated = false;

        this.enabled_text = "empty";
        this.disabled_text = "not_empty";
        this.default_color_change = true;
        // set button to button
        this.button = button;
        button.addEventListener("mouseenter", function() {
            play_sound("audio/hover.mp3");
        });

        // workaround ptr since "this" will be overriden by the button in the event listener function
        let self = this;

        button.addEventListener("click", function(){
            let click_sound = new Audio("audio/click.mp3");
            click_sound.play();
            self.activated = !self.activated;
            // set text to enabled/disabled text
            if (self.default_color_change) {
                switch (self.activated) {
                    case (true):
                        self.button.innerHTML = self.enabled_text;
                        replace_class(self.button,"white_color","red_color");
                        break;
                    case (false):
                        self.button.innerHTML = self.disabled_text;
                        replace_class(self.button,"red_color","white_color");
                        break;
                }
            }
            // if needs a special callback
              if (callback_function) {
                 callback_function();
              }
        });
    }
}

//******************************************************************************
// *************************** SHOOTING GAME CLASS ***************************
//******************************************************************************

class shooting_game {

    constructor() {
        // game elements
        this.game_canvas = document.querySelector("#shooting_game_canvas");
        this.play_button_element = document.querySelector("#game_start_button");
        this.arrow_element = document.querySelector("#direction_arrow");
        this.power_element = document.querySelector("#power_scale");
        this.ball_element = document.querySelector("#shooting_ball");
        this.goal_bounds = document.querySelector("#goal_bounds");
        this.score_element = document.querySelector("#game_score");
        this.notification_element = document.querySelector("#game_notification_paragraph");

        // game variables
        this.is_active = false;
        this.score = 0;
        this.current_stage = "aiming";
        this.current_angle = 0;
        this.current_power = 0;
        this.winding_interval = null;
        this.moving_interval = null;
        this.powering_interval = null;
        // event listener to connect and start game when play button is clicked
        let self = this;
        this.play_button_element.addEventListener("click",function(){
            self.start_shooting_game();
        });
        // listener to check for any clicks within the canvas for game events
        this.game_canvas.addEventListener("click",function(){
            // check if game is active before proceeding
            if (self.is_active) {
                if (self.current_stage == "aiming") {
                    clearInterval(self.winding_interval);
                    self.current_stage = "powering_up";
                    self.power_up();
                } else if (self.current_stage == "powering_up") {
                    clearInterval(self.powering_interval);
                    self.shoot_ball();
                    self.arrow_element.style.display = "none";
                    self.current_stage = "ended";
                    self.notification_element.innerHTML = "Shooting..!";
                }
            }
        });
    }

    power_up(){
        this.notification_element.innerHTML = "Click to stop powering up!";
        let direction = "upwards";
        let self = this;
        this.powering_interval = setInterval(function(){
            self.current_power = (direction == "upwards")?  self.current_power + 1 : self.current_power - 1;
            if (self.current_power >= 100) {
                direction = "downwards";
            } else if (self.current_power <= 0) {
                direction = "upwards";
            }
            self.power_element.innerHTML = `Power : ${self.current_power}`;
        },10);
    }

    start_shooting_game() {
        this.is_active = true;
        remove_class(this.game_canvas,"dark_screen");
        add_class(this.game_canvas,"light_screen");
        this.play_button_element.style.opacity = 0;
        this.play_button_element.style.display = "none";
        let direction = "left";
        let self = this;
        // begin rotating arrow
        this.winding_interval = setInterval(function(){
            if (self.current_angle <= -90) {
                direction = "right";
            } else if (self.current_angle >= 90) {
                direction = "left";
            }
            if (direction == "left") {
                self.current_angle-=2;
            } else if (direction == "right") {
                self.current_angle+=2;
            }
            self.arrow_element.style.transform = `translateX(-50%) rotate(${self.current_angle}deg)`;
        },10);
    }

    shoot_ball() {
        play_sound("audio/kick_fx.mp3");
        // calculate velocity based on power and direction
        let angle_rad = (this.current_angle - 90) * (Math.PI / 180); // adjusted to radians
        let power = this.current_power;
        let velocity = {
            x: Math.cos(angle_rad) * power * 0.05,
            y: -Math.sin(angle_rad) * power * 0.05,
        };

        let ball = this.ball_element;
        let pos = { 
            x : 0, 
            y : 0,
        };
        let scale = 1;
        let timer = 0;

        let self = this;
        // apply velocity to the ball and stop it after 1 second
        this.moving_interval = setInterval(function(){
            pos.x += velocity.x;
            pos.y += velocity.y;
            scale = Math.max(0.7, scale - 0.01);

            ball.style.transform = `translate(calc(-50% + ${pos.x}px), -${pos.y}px) scale(${scale})`;

            timer+= 0.01;  //10 milliseconds
            // end condition
            if (timer >= 1.2) {
                clearInterval(self.moving_interval);
                // check if the ball element is within the hidden goalpost element
                if (is_inside_element(ball,self.goal_bounds)){
                    self.notification_element.innerHTML = "You scored a goal! Congratulations!";
                    ++self.score;
                    play_sound("audio/cheer_fx.mp3");
                } else {
                     self.notification_element.innerHTML = `Unlucky! you missed! Your score was : ${self.score}`;
                    play_sound("audio/boo_fx.mp3");
                    self.score = 0;
                }
                setTimeout(function(){
                    self.reset_shooting_game();
                },1000);
                return;
            }
            self.score_element.innerHTML = `Score : ${self.score}`;

        },10);
    }

    end_shooting_game(reset){
        // dont reset score if called from reset_shooting_ame
        if (!reset) {
            this.score = 0;
        }
        // clear all intervals and reset screen to dark
        clearInterval(this.winding_interval);
        clearInterval(this.moving_interval);
        replace_class(this.game_canvas,"light_screen","dark_screen");

        // set all variables and information texts to original states
        this.is_active = false;
        this.notification_element.innerHTML = "Click to stop the arrow ! (Direction)";
        this.current_angle = 0;
        this.arrow_element.style.display = "block";
        this.play_button_element.style.opacity = 1;
        this.play_button_element.style.display = "block";
        this.ball_element.style.transform = "translateX(-50%) scale(1)";
        this.current_stage = "aiming";
        this.power_element.innerHTML = `Power : 0`;
        this.current_power = 0;
        this.score_element.innerHTML = `Score : ${this.score}`;
    }

    // end and start game
    reset_shooting_game(){
        this.end_shooting_game(true);
        this.start_shooting_game();
    }
}

// function to change page
function ChangePage(page, disable_all) {
    // check if current page is the page
    if (disable_all || !available_pages[page].visible) {
        // end shooting game so it doesnt keep running when the page changes
        //end_shooting_game();
        // disable all pages
        Object.keys(available_pages).forEach(function (pages) {
            available_pages[pages].change_visibility(false);
        });
        // enable clicked page
        if (!disable_all) {
            available_pages[page].change_visibility(true);
            document.getElementById("start_point").scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    }
}

const slides = [
    "images/pitch_football.jpg",
    "images/football_stadium.jpg",
    "images/football_main.jpg",
    "images/stadium_football.jpg",
];

const slideshow_img = document.getElementById("slideshow_image");
let index = 0;

function Change_slideshow() {
    slideshow_img.style.filter = "brightness(0)";
    index++;
    index = (index >= slides.length) ? 0 : index;
    // settimeout (function (anonymous function in this case), delay milliseconds)
    setTimeout(function () {
        // change src after delay so that it does not change during transition
        slideshow_img.src = slides[index];
        slideshow_img.style.filter = "brightness(0.75)";
    }, 400);
}


function change_menu_visibility(navigation_buttons,visible){
    for (let i = 0; i < navigation_buttons.length; i++) {
        // ensure that the navigation button isnt the menu button
        if (navigation_buttons[i].id != "menu_button") {
            // set the display accordingly
            if (visible) {
                add_class(navigation_buttons[i],"visible");
            } else 
                remove_class(navigation_buttons[i],"visible");
        } else {
            // tenary operator, change display_text based on visible value
            let display_text = (visible) ? "Close Menu" : "Open Menu";
            // set innerhtml accordingly
            navigation_buttons[i].innerHTML = display_text;
        }
    }
}

// for game quiz check
function check_answer(question,correct_value,checkbox){
    // ensure that it is not null (none selected)
    if (question) {
        if (checkbox) {
            // check if all correct boxes are checked
            let all_correct = true;
            // check if any wrong boxes are checked
            let any_wrong = false;
            
            question.forEach(function(box) {
                if (box.value === "correct" && !box.checked) {
                    // did not check correct box, no mark awarded
                    all_correct = false;
                }
                if (box.value === "wrong" && box.checked) {
                    // wrong box, no mark awarded
                    any_wrong = true;
                }
            });
            
            // only true if all correct and none wrong
            return all_correct && !any_wrong;
        } else {
            // check if parameter type is number (in the case of number input type, .value is read and sent over)
            if (typeof(question) == "number") {
                // check for "" in the case of number input type
                if (question == correct_value && question != "") {
                    return true;
                }
            } else {

                let value = question.value;

                if (value == correct_value) {
                    return true;
                }
            }
        }
    }
    // wrong or null, return false
    return false;
}

//extra quiz elements (paragraphs and extra texts)
const extra_quiz_elements = document.getElementsByClassName("quiz_extra");
// change quiz visibility function
function change_quiz_visibility(visible) {
    // loop through all question elements
    // start at 1 since first element is q1_field
    for (let i = 1;i < 5;i++) {
        // get the question element
        let q_element = document.getElementById(`q${i}_field`);
        // set the display accordingly to visibility
        q_element.style.display = (visible) ? "block" : "none";
    }
    for (let i = 0;i<extra_quiz_elements.length;i++) {
        // set display accordingly
        extra_quiz_elements[i].style.display = (visible) ? "block" : "none";
    }
}



// main function for main code
function main() {
    // creating shooting game instance
    let penalty_game = new shooting_game();
    // retrieving array of button elements, create a real array from the nodelist using array.from so that it can be looped through using forEach, which is important because it creates its own closure every iteration
    const navigation_buttons = Array.from(document.getElementsByClassName("top_nav_button"));

    //******************************************************************************
    // *************************** PAGE NAVIGATION ***************************
    //******************************************************************************

    // for RWD, check if the top down menu is enabled or not
    let menu_visible = false;

    // looping through all buttons and adding click event listener
    navigation_buttons.forEach(function(navigation_button_element) {
        // ensure that the navigation button isnt the menu button
        if (navigation_button_element.id != "menu_button") {
            // retrieving id of button
            let page_name = navigation_button_element.id;

            let reset_page_callback = function(){
                penalty_game.end_shooting_game();
                ChangePage(page_name);
            };

            // create button instance
            let button_instance = new button(navigation_button_element,reset_page_callback);
            // set to false since no text change or want red color change
            button_instance.default_color_change = false;

            // creating page class object and linking to article
            let page_object = new page(page_name);
            page_object.link(page_name.toString() + "_article", page_name);

            // adding page_object (class) to dictionary
            available_pages[page_name] = page_object;
        } else {
            let menu_click_callback = function(){
                // set visibility to opposite
                menu_visible = !menu_visible;
                change_menu_visibility(navigation_buttons,menu_visible);
            };

            // menu button
            let menu_button_instance = new button(navigation_button_element,menu_click_callback);
            menu_button_instance.default_color_change = false;
        }
    });

    //******************************************************************************
    // *************************** EXTENSION BUTTONS ***************************
    //******************************************************************************

    // retrieve array of extension button elements within the dom, create a real array from the nodelist using array.from
    let extension_buttons = Array.from(document.getElementsByClassName("extension_button"));

    // loop through extension buttons
    extension_buttons.forEach(function(extension_button_element) {
        // retrieve the parent element class ("article_section")
        let extension_button_instance = new button(extension_button_element);
        extension_button_instance.set_texts("Read less", "Read more");

        let extension_paragraph_parent = extension_button_element.parentElement;
        // retrieve the extension pargraph
        let extension_paragraph = extension_paragraph_parent.querySelector(".extension_paragraph");
        // hide extension at first
        add_class(extension_paragraph,"invisible_font");
        // event listener to listen to click on the extension button
        extension_button_instance.button.addEventListener("click",function(){
            // if button is activated, hide paragraph, if not, show paragraph
            if (extension_button_instance.activated == true) {
                replace_class(extension_paragraph,"invisible_font","regular_font");
            } else {
                replace_class(extension_paragraph,"regular_font","invisible_font");
                replace_class(extension_button_element,"black_color","white_color");
            }
        });
    });

    //******************************************************************************
    // *************************** BALL ANIMATIONS ***************************
    //******************************************************************************

    const basics_article = document.getElementById("basics_button_article");

    // click handler for the entire article, delegate events based on target
    basics_article.addEventListener("click",function(event){
        // get the clicked element
        let football = event.target;
        let removing_class;
        let delay = 0;
        // ensure that the element has the clickable football class and its not currently playing an animation
        if (football.classList.contains("clickable_football") && !football.classList.contains("passing_animation") && !football.classList.contains("shooting_animation") && !football.classList.contains("heading_animation")) {
            play_sound("audio/kick_fx.mp3");
            // refresh animation on click
            switch(football.id) {
                case("pass_ball") : 
                    replace_class(football,"passing_animation","passing_animation");
                    removing_class = "passing_animation";
                    delay = 3200;
                    break;
                case("shoot_ball") :
                    replace_class(football,"shooting_animation","shooting_animation");
                    removing_class = "shooting_animation";
                    delay = 900;
                    break;
                case("head_ball") :
                    replace_class(football,"heading_animation","heading_animation");
                    removing_class = "heading_animation";
                    delay = 1500;
                    break;
            }
            // delay before removing the animation class from the obj, so it will not play again (without clicking) when the element is rendered
            setTimeout(function(){
                remove_class(football,removing_class);
            },delay);
        }
    });

    //******************************************************************************
    // *************************** RANDOM FUN FACTS ***************************
    //******************************************************************************

    const leagues_article = document.getElementById("leagues_button_article");
    // fun facts dictionary, explicitly treat it as a string so that indexing will work, dictionary index is id of elements
    const fun_facts = {
        pl_fact : [
            "Richest league in football : generated £6.3 billion in the 2023 24 season, making it the most commercially valuable league in Europe ",
            "Players reaching peak views : it's broadcast in 212 territories, reaching up to 4.7 billion potential viewers",
            "Leicester City's fairytale : Astonishingly won the title in 2016 as 5,000 to 1 outsiders",
        ],
        laliga_fact : [
            "European dominance : La Liga clubs have won 20 Champions League, 14 Europa League, and 16 UEFA Super Cups—top across major competitions",
            "Unique never-relegated clubs : Athletic Bilbao, Barcelona, and Real Madrid have never been relegated from La Liga since its inception",
            "Elite creativity and fans : known for technically gifted play and supported by global fanbases, with average match attendance around 27,000",
        ],
        serie_fact : [
            "Tactical sophistication : famed for its defensive discipline and planning; historic sides held opponents to fewer than 25 goals in full seasons",
            "Inter unbeaten rivals : Inter Milan is the only Serie A club to have never been relegated since the leagues formation",
            "Consistent top European performance : in 2023 to 24, all seven Serie A clubs reached the knockout rounds of European competitions",

        ],
        bundes_fact : [
            "Highest average attendance : averaging around 38,656 fans per game, the Bundesliga ranks first in Europe for attendance",
            "Member owned clubs : the “50+1 rule” ensures clubs are majority-owned by members, preserving fan-control and stability",
            "Unbeaten champions : Bayer Leverkusen ended Bayerns 11-year title run in 2023 to 24 by winning the Bundesliga undefeated",
        ], 
        ligue_fact : [
            "Youth factory of talent : Ligue 1 is a proven springboard, producing global stars like Mbappé, Coman, and Henry via Lyon, PSG, Monaco academies",
            "Changing title scenes : from 2002 to 2008 Lyon won seven titles in a row; between 2009 and 2012, four different clubs won consecutively",
            "PSG dominance : Paris Saint Germain claimed their 13th Ligue 1 title in the 2024 to 25 season and have featured in the league continuously since 1974",
        ],
    };
    // click handler for the entire article, delegate events based on target
    leagues_article.addEventListener("click",function(event){
        // get the clicked element
        let fact_button = event.target;
        // ensure that the element has the fact_button class
        if (fact_button.classList.contains("fact_button")) {
            // get the array of fun facts from id
            let facts_list = fun_facts[fact_button.id];
            // div container to hold the fun fact (named : id.."_area")
            let fact_container = document.getElementById(`${fact_button.id}_area`);  
            // remove all children inside that container to add new one
            fact_container.replaceChildren();
            let random_fact = document.createElement('p');
            add_class(random_fact,"transition_font_size");
            random_fact.style.fontSize = '0em';
            // add new p element to container
            fact_container.appendChild(random_fact);
            let random_number = get_random_int(0,facts_list.length);
            void random_fact.offsetWidth;
            random_fact.innerHTML = `Fun fact ${random_number + 1} : ${facts_list[random_number]}`; // + 1 so it doesnt show Fun fact 0
            random_fact.style.fontSize = '1em';
        }
    });

    //******************************************************************************
    // *************************** QUIZ ***************************
    //******************************************************************************

    // button elements
    const submit_buton = document.getElementById("submit_quiz_id");
    const retry_button = document.getElementById("retry_quiz_id");
    const quiz_score_element = document.getElementById("quiz_score");
    // hide retry button initially
    retry_button.style.display = "none";

    let quiz_score = 0;

    submit_buton.addEventListener("click",function(){
        // get all checked values from q1
        // || null to see if a value is entered, if not automatic null
        let q1_value = document.querySelector("input[name='q1']:checked") || null;
        let q2_value = document.querySelector("input[name='q2']:checked") || null;
        let q3_values = document.querySelectorAll("input[name='q3']") || null;
        let q4_value = parseInt(document.querySelector("#q4_field").value) || null;
        // check answers and add value accordingly
        if (check_answer(q1_value,"correct")) ++quiz_score;
        if (check_answer(q2_value,"correct")) ++quiz_score;
        if (check_answer(q3_values,"correct",true)) ++quiz_score;
        if (check_answer(q4_value,1)) ++quiz_score;
        // hide quiz elements and display score, also give option to retry
        change_quiz_visibility(false);
        retry_button.style.display = "block";
        submit_buton.style.display = "none";
        quiz_score_element.innerHTML = `Your score : ${quiz_score} / 4 !`;
    });

    retry_button.addEventListener("click",function(){
        // reset quiz
        quiz_score = 0;
        retry_button.style.display = "none";
        submit_buton.style.display = "block";
        change_quiz_visibility(true);
    });


    // loop to change the slides
    setInterval(Change_slideshow, 4000);
    // reset page on first time
    ChangePage(null, true);
}

// call main func
main();