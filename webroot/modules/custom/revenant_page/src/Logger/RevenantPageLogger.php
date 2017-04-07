<?php
/**
 * Created by PhpStorm.
 * User: Keenan
 * Date: 4/5/17
 * Time: 10:36 AM
 */

namespace Drupal\revenant_page\Logger;

class RevenantPageLogger {
    public function __construct($factory) {
        $this->loggerFactory = $factory;
    }

    public function log($message) {
        // Logs a notice to "my_module" channel.
        $this->loggerFactory->get('revenant_page')->notice($message);
        // Logs an error to "my_other_module" channel.
        $this->loggerFactory->get('revenant_page')->error($message);
    }

}
