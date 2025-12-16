<?php

namespace AmplifyCode\Filter\Components;

use Illuminate\View\Component;

class PageSize extends Component
{

    public $blade;
    public $options = [15,25,50,100, 500, 1000];

    // public $filterManager;
    /**
     * Create a new component instance.
     *
     * @return void
     */
    public function __construct($blade='default', $options = []) {

        if(count($options) > 0 ) {
            $this->options = $options;
        }

    }

    /**
     * Get the view / contents that represent the component.
     *
     * @return \Illuminate\Contracts\View\View|string
     */
    public function render() {
        return view('filter::pagesize');
    }
}
