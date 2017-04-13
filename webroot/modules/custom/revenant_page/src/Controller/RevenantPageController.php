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
use Symfony\Component\HttpFoundation\Response;



class RevenantPageController extends ControllerBase
{
    /**
     * Proxy for handling authentication, retrieves client credentials.
     */
    //endpoint for proxying request credentials
    public function post_creds(Request $request)
    {
        $content = json_decode($request->getContent(), TRUE);
        $origin = strtr($content['origin'], array('.' => '-', '/' => '-'));
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

    //endpoint for creating a revenent page entity reference, must be associated with all revenant page content nodes for rest export of content.
    public function post_page_create(Request $request)
    {
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

        // create default content node for page, so on load with no content yet saved the page is not created a second time.
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

        //all endpoints must return a response
        $response['data'] = 'Post to revenent_page_create successful';
        $response['method'] = 'POST';
        return new JsonResponse($response);
    }


    //endpoint for posting page content
    public function post_page_content(Request $request)
    {
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
            //entityQuery returns array of results, must use reset to get only returning result
            $results = $query->execute();
            $nid = reset($results);

            //get uid from current client user.
            $users = \Drupal::entityTypeManager()->getStorage('user')
                ->loadByProperties(['name' => $editorData['username']]);
            $user = reset($users);
            $uid = $user->id();

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

        $response['data'] = 'Post to revenant post content successful';
        $response['method'] = 'POST';

        return new JsonResponse($response);
    }


    // endpoint used for uploading images in ckeditor. Uploaded images in ckeditor must be saved and have a url to reference.
    //BIG TODO: associate saved images with revenant image content types to be associated with revenant page content. Saving to public file system (tried to save to temp, cannot make accessible because of .htaccess written to temp on every file save) was a temporary solution. Getting rid of image content that is not associated with any revenant page content will need to be done as well.
    public function post_page_content_image(Request $request)
    {
        //callback function ckeditor simpleuploads needs for saved images
        $funcNum = \Drupal::request()->query->get('CKEditorFuncNum') ;

        //public files directory in drupal
        $tempFilePath = 'public://' . 'temp/'. $_FILES['upload']['name'];

        //save uploaded image file to public dir
        if(move_uploaded_file($_FILES["upload"]["tmp_name"], $tempFilePath)) {
            \Drupal::logger('revenant_page')->notice('file saved!');
        } else {
            \Drupal::logger('revenant_page')->notice($_FILES["upload"]["error"]);
        }


        //create image node for page on check
//        $image_node = Node::create(array(
//            'type' => 'revenant_image',
//            'title' => 'revenant image',
//            'langcode' => 'en',
//            'status' => 1,
//            'field_inline_image' => $_FILES["upload"]["tmp_name"],
//        ));
//
//        $public_url = file_create_url($image_node->field_inline_image->entity->getFileUri());
//        $image_node->save();

        //leave message blank to avoid browser alert
        $msg = '';

        //create a public url to send back for uploaded image.
        $public_url = file_create_url($tempFilePath);
        \Drupal::logger('revenant_page')->notice($public_url);

        $response = new Response();
        //see the ckeditor simpleuploads plugin directory for documentation on this response code.
        $response->setContent('<html><body><script type="text/javascript">window.parent.CKEDITOR.tools.callFunction(' . $funcNum . ', "'.$public_url.'","'.$msg.'");</script></body></html>');

        return $response;
    }

}

