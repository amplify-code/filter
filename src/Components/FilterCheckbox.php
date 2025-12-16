<?php

namespace AmplifyCode\Filter\Components;

use Illuminate\View\Component;

class FilterCheckbox extends Component
{

    public $filterName = null;
    public $query = null;
    public $title = null;
    public $labelField = null;
    public $idField = null;
    public $value = [];
    public $checkedvalue = 1;

    /**
     * Create a new component instance.
     *
     * @return void
     */
    public function __construct($title, $filterName, $value=[], $checkedvalue=1) {
    
        $this->filterName = $filterName;
        $this->title = $title;
        $this->value = $value;
        $this->checkedvalue = $checkedvalue;

    }

    /**
     * Get the view / contents that represent the component.
     *
     * @return \Illuminate\Contracts\View\View|string
     */
    public function render()
    {
        return view('filter::checkbox');
    }
}
