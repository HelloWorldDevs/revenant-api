<?php
/**
 * @file Contains the code to generate the custom drush commands.
 */

/**
 * Implements hook_drush_command().
 */
function drush_delete_drush_command() {
  $items = array();
  $items['delete-all'] = [
    'description' => 'Delete all contents.',
    'arguments' => [
      'type' => 'The entity type name',
    ],
    'drupal dependencies' => ['drush_delete'],
    'aliases' => ['delete-all article'],
  ];
  return $items;
}

/**
 * Call back function drush_custom_drush_command_say_hello()
 * The call back function name in the  following format
 *   drush_{module_name}_{item_id_for_command}()
 */
function drush_drush_delete_delete_all($type = '') {
  $service = \Drupal::service('drush_delete.entity');
  drush_print($service->deleteAllEntityType($type));
}