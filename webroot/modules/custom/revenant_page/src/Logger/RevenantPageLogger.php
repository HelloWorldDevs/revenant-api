<?php
/**
 * Created by PhpStorm.
 * User: Keenan
 * Date: 4/5/17
 * Time: 10:36 AM
 */

namespace Drupal\revenant_page\Logger;

use Drupal\Core\Logger\RfcLoggerTrait;
use Psr\Log\LoggerInterface;


class RevenantPageLogger implements LoggerInterface {
    use RfcLoggerTrait;

    /**
     * {@inheritdoc}
     */
    public static function log($level, $message, array $context = array()) {
        \Drupal::logger('revenant_page')->notice($message);
    }

}
