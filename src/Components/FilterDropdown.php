<?php

namespace AmplifyCode\Filter\Components;

use Illuminate\View\Component;

class FilterDropdown extends Component
{

    public $filterName = null;
    public $query = null;
    public $title = null;
    public $labelField = null;
    public $idField = null;
    public $value = [];

    /**
     * Create a new component instance.
     *
     * @return void
     */
    public function __construct($filterName, $query, $title, $value=[], $labelField='title', $idField='id') {
    
        $this->filterName = $filterName;
        $this->query = $query;
        $this->title = $title;
        $this->labelField = $labelField;
        $this->idField = $idField;
        $this->value = $value ?? [];

    }

    /**
     * Get the view / contents that represent the component.
     *
     * @return \Illuminate\Contracts\View\View|string
     */
    public function render()
    {
        return view('filter::dropdown');
    }
}
