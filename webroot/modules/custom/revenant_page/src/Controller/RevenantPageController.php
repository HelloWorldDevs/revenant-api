<?php
/**
 * @file
 * Contains \Drupal\revenant_page\Controller\RevenantPageController.
 */

namespace Drupal\revenant_page\Controller;

use Drupal\Core\Controller\ControllerBase;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;

use Drupal\node\Entity\Node;

class RevenantPageController extends ControllerBase
{


    /**
     * Proxy for handling authentication, retrieves client credentials.
     */
    public function post_creds(Request $request)
    {
        $content = json_decode($request->getContent(), TRUE);
        $origin = $content['origin'];
        $username = $content["username"];
        $password = $content["password"];

        $config = \Drupal::config('revenant_page.settings');
        if ($config->get('credentials.' . $origin)) {
            $cred_data = $config->get('credentials.' . $origin);
            $client_id = $cred_data['client_id'];
            $client_secret = $cred_data['client_secret'];
            $auth_body = array(
                'grant_type' => "password",
                'username' => $username,
                'password' => $password,
                'client_id' => $client_id,
                'client_secret' => $client_secret
            );
            $client = new \GuzzleHttp\Client();
            $response = $client->post('http://revenant-api.bfdig.com/oauth/token', [
                'form_params' => $auth_body
            ]);
            $response = $response->getBody()->getContents();
        }
        return new JsonResponse($response);
    }

    public function post_page_create(Request $request)
    {
        // This condition checks the `Content-type` and makes sure to
        // decode JSON string from the request body into array.
        if (0 === strpos($request->headers->get('Content-Type'), 'application/json')) {
            $data = json_decode($request->getContent(), TRUE);
            $request->request->replace(is_array($data) ? $data : []);
        }
        $content = json_decode($request->getContent(), TRUE);

        //create node for page on check
        $page_node = Node::create(array(
            'type' => 'revenant_page',
            'title' => $content['title'],
            'langcode' => 'en',
            'status' => 1,
            'field_page_url' => $content['url'],
        ));
        $page_node->save();
        $page_node_id = $page_node->id();

        // create default content node for page
        $content_node = Node::create(array(
            'type' => 'revenant_content_item',
            'title' => $content['title'] . 'default content item',
            'langcode' => 'en',
            'status' => 1,
            'field_old_content' => 'default content item',
            'field_new_content' => 'default content item',
            'field_xpath' => 'default content item',
        ));
        $content_node->field_page->target_id = $page_node_id;
        $content_node->save();

        $response['data'] = 'Post ';
        $response['method'] = 'POST';

        return new JsonResponse($response);
    }

    public function post_page_content(Request $request)
    {
        if (0 === strpos($request->headers->get('Content-Type'), 'application/json')) {
            $data = json_decode($request->getContent(), TRUE);
            $request->request->replace(is_array($data) ? $data : []);
        }
        $content = json_decode($request->getContent(), TRUE);
        $editorData = $content['data'];

        //query to see if node with editor data xpath exists
        $node_exists_query = $query = \Drupal::entityQuery('node')
            ->condition('status', 1)
            ->condition('type', 'revenant_content_item')
            ->condition('field_xpath', $editorData['xpath']);
        $node_exists_results = $node_exists_query->execute();
        $nid_exists = reset($node_exists_results);

        //if node exists, update new content field.
        if ($nid_exists) {
            $node_to_update = Node::load($nid_exists);
            $node_to_update->field_new_content = html_entity_decode($content['editabledata']);
            $node_to_update->save();
        } else {
            //if node doesn't exist create node with revenant page entity reference.
            //get revenenat page entity reference
            $query = \Drupal::entityQuery('node')
                ->condition('status', 1)
                ->condition('type', 'revenant_page')
                ->condition('title', $editorData['url']);
            $results = $query->execute();
            $nid = reset($results);

            //get uid from current client user.
            $users = \Drupal::entityTypeManager()->getStorage('user')
                ->loadByProperties(['name' => $editorData['username']]);
            $user = reset($users);
            $uid = $user->id();

            //TODO remove tags for edit text and content-editable
            //create node for page on check
            $node = Node::create(array(
                'type' => 'revenant_content_item',
                'title' => html_entity_decode($editorData['title']),
                'langcode' => 'en',
                'uid' => $uid,
                'status' => 1,
                'field_old_content' => html_entity_decode($editorData['oldText']),
                'field_xpath' => $editorData['xpath'],
                'field_new_content' => html_entity_decode($content['editabledata'])
            ));
            $node->field_page->target_id = $nid;
            $node->save();
        }

        $response['data'] = 'Post ';
        $response['method'] = 'POST';


        return new JsonResponse($response);
    }

}