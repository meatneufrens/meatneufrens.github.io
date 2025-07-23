// dictionary to store page classes
var available_pages = {};

function remove_class(element,classname) {
    if (element.classList.contains(classname)) {
        element.classList.remove(classname);
    }
}

function add_class(element,classname) {
    element.classList.add(classname);
}


// creating a class for pages to store information
class page {
    // protected vars
    #button
    #article
    // article and button var to store button and article element

    constructor(name) {
        this.page_name = name;
        this.#button = null;
        this.#article = null;
        this.visible = false;
    }

    // page method to add element to article and button vars
    link(article_id, button_id) {
        this.#article = document.getElementById(article_id);
        this.#button = document.getElementById(button_id);
    }

    change_visibility(visibility) {
        // change visibility value and change display type
        this.visible = visibility;
        if (visibility) {
            this.#article.style.display = "block";
            add_class(this.#button,"selected_button");
            remove_class(this.#button,"interactive_button");
        } else {
            remove_class(this.#button,"selected_button");
            add_class(this.#button,"interactive_button");
            this.#article.style.display = 'none';
        }
    }
}

// class for button
class button {
    // var to store button element
    button;
    // activation bool check
    activated = false;

    enabled_text = "empty";
    disabled_text = "not_empty";

    // function to set text vars

    set_texts(enabled_text, disabled_text) {
        this.enabled_text = enabled_text;
        this.disabled_text = disabled_text;
        // first time, always disabled (not activated)
        this.button.innerHTML = disabled_text;
    }

    constructor(button, callback_function) {
        // set button to button
        this.button = button;
        button.addEventListener("click", () => {
            this.activated = !this.activated;
            // set text to enabled/disabled text
            switch (this.activated) {
                case (true):
                    this.button.innerHTML = this.enabled_text;
                    remove_class(this.button,"white_color");
                    add_class(this.button,"red_color");
                    break;
                case (false):
                    this.button.innerHTML = this.disabled_text;
                    remove_class(this.button,"red_color");
                    add_class(this.button,"white_color");
                    break;
            }
            
            // if needs a special callback
              if (callback_function) {
                 callback_function();
              }
        })
    };

}

// class for sub pages, extends to page for inheritance as sub_page will inheirt page properties
class sub_page extends page {
    constructor(name) {
        super(name); // note to self : virtual? check again (lowk forgot)
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
            document.getElementById("start_point").scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
            available_pages[page].change_visibility(true);
        }
    }
};

const slides = [
    "images/pitch_football.jpg",
    "images/football_stadium.jpg",
    "images/football_main.jpg",
    "images/stadium_football.jpg",
];

const slideshow_img = document.getElementById("slideshow_image");
var index = 0;

function Change_slideshow() {
    slideshow_img.style.filter = "brightness(0)";
    index++;
    index = (index >= slides.length) ? 0 : index;
    // settimeout (function (anonymous function in this case), delay milliseconds)
    setTimeout(function () {
        // change src after delay so that it does not change during transition
        slideshow_img.src = slides[index];
        slideshow_img.style.filter = "brightness(0.75)";
    }, 400)
}

// game elements
class shooting_game {
    // game elements
    game_canvas = document.querySelector("#shooting_game_canvas");
    play_button_element = document.querySelector("#game_start_button");
    arrow_element = document.querySelector("#direction_arrow");
    power_element = document.querySelector("#power_scale");

    // game variables
    is_active = false;
    current_stage = "aiming"
    current_angle = 120;
    current_power = 0;

    constructor() {
        // event listener to connect and start game when play button is clicked
        this.play_button_element.addEventListener("click",() =>{
            this.start_shooting_game();
        })
        // listener to check for any clicks within the canvas for game events
        this.game_canvas.addEventListener("click",() =>{
            // check if game is active before proceeding
            if (this.game_is_active) {

            }
        })
    }


    start_shooting_game() {
        this.game_is_active = true;
        remove_class(this.game_canvas,"dark_screen");
        add_class(this.game_canvas,"light_screen");
        this.play_button_element.style.opacity = 0;
        this.play_button_element.style.display = "none";
        // async function to prevent yielding
        setInterval(()=>{
            let direction = "left";
            if (this.current_angle <= -120) {
                direction = "right";
            } else if (this.current_angle >= 120) {
                direction = "left";
            }
            if (direction == "left") {
                this.current_angle-=5;
            } else if (direction == "right") {
                this.current_angle+=5;
            }
            this.arrow_element.style.transform = `translateX(-50%) rotate(${this.current_angle}deg)`;
        },10)
    }

    end_shooting_game(){
        this.game_is_active = false;
        remove_class(this.game_canvas,"light_screen");
        add_class(this.game_canvas,"dark_screen");
        this.play_button_element.style.opacity = 1;
        this.play_button_element.style.display = "block";
    }

    reset_shooting_game() {

    }
}

// main function for main code

function main() {
    // creating shooting game instance
    let penalty_game = new shooting_game();
    // retrieving array of button elements
    var navigation_buttons = document.getElementsByClassName("top_nav_button")
    // looping through all buttons and adding click event listener
    for (var i = 0; i < navigation_buttons.length; i++) {
        let buttons = navigation_buttons[i];
        // retrieving id of button
        let page_name = buttons.id;
        // creating page class object and linking to article
        let page_object = new page(page_name);
        page_object.link(page_name.toString() + "_article", page_name);

        // adding page_object (class) to dictionary
        available_pages[page_name] = page_object;
        // adding listener for click on navigation button
        buttons.addEventListener("click", function () {
            // call change page func on click
            penalty_game.end_shooting_game();
            ChangePage(page_name);
        });
    }
    // retrieve array of extension button elements within the dom
    var extension_buttons = document.getElementsByClassName("extension_button")
    // loop through extension buttons
    for (let i = 0; i < extension_buttons.length; i++) {
        // retrieve the parent element class ("article_section")
        let extension_button = new button(extension_buttons[i], display_callback);
        extension_button.set_texts("Read less", "Read more");

        let extension_paragraph_parent = extension_button.button.parentElement;
        // retrieve the extension pargraph
        let extension_paragraph = extension_paragraph_parent.querySelector(".extension_paragraph");
        // hide extension at first
        add_class(extension_paragraph,"invisible_font");
        function display_callback() {
            if (extension_button.activated == true) {  
               // extension_paragraph.style.maxHeight = extension_paragraph.scrollHeight + 'px'; 
               remove_class(extension_paragraph,"invisible_font");
               add_class(extension_paragraph,"regular_font");
            } else {
                //extension_paragraph.style.maxHeight = '0px';
                remove_class(extension_paragraph,"regular_font");   
                add_class(extension_paragraph,"invisible_font");
                
               remove_class(extension_buttons[i],"black_color");
               add_class(extension_buttons[i],"white_color");
            }
        }
    }

    setInterval(Change_slideshow, 4000);
    ChangePage(null, true);

    // event listener to check for scroll
    document.addEventListener("scroll", function () {

    });
};

main();