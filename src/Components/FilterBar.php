<?php

namespace AmplifyCode\Filter\Components;

use Illuminate\View\Component;

class FilterBar extends Component
{


    /**
     * Create a new component instance.
     *
     * @return void
     */
    public function __construct() {
    

    }

    /**
     * Get the view / contents that represent the component.
     *
     * @return \Illuminate\Contracts\View\View|string
     */
    public function render()
    {
        return view('filter::bar');
    }
}
