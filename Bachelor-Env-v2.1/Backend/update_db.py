import mysql.connector
import xml.etree.ElementTree as ET
import json
from datetime import date

def pull_from_db_sens(customer_name):
    # connect to sensitive db files
    mydb = mysql.connector.connect(
        host="mysqldb-sens",
        user="root",
        password="Password-123",
        database=customer_name
    )
    cursor = mydb.cursor()
    # selecting all rows and columns from the xml-table
    cursor.execute(f"SELECT * FROM xml")
    # storing the rows as a python list
    xml_list = cursor.fetchall()
    cursor.close()
    
    # printing and return the list fetched from xml-table
    print(' Fetched items from db-sens:')
    for fetched in xml_list:
        print('     ' + fetched[1])
    return xml_list

def reset_db_filt():
    # mysql connection
    mydb = mysql.connector.connect(
        host="mysqldb-filt",
        user="root",
        password="Password-123"
    )
    
    # rebuild the database
    cursor = mydb.cursor()
    cursor.execute("DROP DATABASE IF EXISTS customer")
    cursor.execute("CREATE DATABASE customer")
    cursor.close()
    
    # database connection
    mydb = mysql.connector.connect(
        host="mysqldb-filt",
        user="root",
        password="Password-123",
        database="customer"
    )
    
    # rebuild the table and instert the test process
    cursor = mydb.cursor()
    cursor.execute("DROP TABLE IF EXISTS xml")
    cursor.execute("CREATE TABLE xml (id INT AUTO_INCREMENT PRIMARY KEY, processId VARCHAR(255) NOT NULL, name VARCHAR(255) NOT NULL, content LONGTEXT NOT NULL)")
    cursor.close()
    print('DB filt is reset')

def push_to_db_filt(id: str, name: str, content: str):
    # connect to filtered db files
    mydb = mysql.connector.connect(
        host="mysqldb-filt",
        user="root",
        password="Password-123",
        database="customer"
    )
    cursor = mydb.cursor()
    # sql string with arguments
    sql = "INSERT INTO xml (processId, name, content) VALUES (%s, %s, %s)"
    name = name.lower()
    args = (id, name, content)
    cursor.execute(sql, args)
    # commit the commands
    mydb.commit()
    cursor.close()
    print('- Inserted into db-filt: ' + name)

def analyze(xml_string: str):
    # parse xml file
    file_root = ET.fromstring(xml_string)

    # namespace
    ns = {
        'bpr': 'http://www.blueprism.co.uk/product/release',
        'proc': 'http://www.blueprism.co.uk/product/process',
    }
    
    dict_root = {}
    dict_root['info'] = {
        'name' : file_root.find('bpr:name', ns).text if file_root.find('bpr:name', ns) is not None else None,
        'releasenotes' : file_root.find('bpr:release-notes', ns).text if file_root.find('bpr:release-notes', ns) is not None else None,
        'created' : file_root.find('bpr:created', ns).text if file_root.find('bpr:created', ns) is not None else None,
        'packageid' : file_root.find('bpr:package-id', ns).text if file_root.find('bpr:package-id', ns) is not None else None,
        'packagename' : file_root.find('bpr:package-name', ns).text if file_root.find('bpr:package-name', ns) is not None else None,
        'usercreatedby' : file_root.find('bpr:user-created-by', ns).text if file_root.find('bpr:user-created-by', ns) is not None else None,
    }
    
    # outer process
    proc = file_root.find('.//proc:process', ns)
    
    if proc is not None:
        dict_root['process'] = {
            'id' : proc.get('id'),
            'name' : proc.get('name'),
            'xmlns' : proc.get('xmlns'),
        }
        inner_proc = proc.find('.//proc:process', ns)
        if inner_proc is not None:
            dict_root['process']['version'] = inner_proc.get('version')
            dict_root['process']['bpversion'] = inner_proc.get('bpversion')
            dict_root['process']['narrative'] = inner_proc.get('narrative')
            dict_root['process']['byrefcollection'] = inner_proc.get('byrefcollection')
            dict_root['process']['subsheetlist'] = []
            dict_root['process']['stagelist'] = []
        
        #view
        element = inner_proc.find('.//proc:view', ns)
        if element is not None:
            dict_root['process']['view'] = {
                'camerax' : float(element.find('.//proc:camerax', ns).text) if element.find('.//proc:camerax', ns) is not None else None,
                'cameray' : float(element.find('.//proc:cameray', ns).text) if element.find('.//proc:cameray', ns) is not None else None,
                'zoom' : float(element.find('.//proc:zoom', ns).text) if element.find('.//proc:zoom', ns) is not None else None,
            }
        
        # preconditions
        element = proc.find('.//proc:preconditions', ns)
        if element is not None:
            dict_root['process']['preconditions'] = []
            conditions = element.findall('.//proc:condition', ns)
            for condition in conditions:
                dict_root['process']['preconditions'].append(condition.get('narrative'))
        
        # endpoint
        dict_root['process']['endpoint'] = proc.find('.//proc:preconditions', ns).get('narrative') if proc.find('.//proc:preconditions', ns) is not None else None

        # subsheets
        for subsheet in proc.findall('.//proc:subsheet', ns):
            sub_dict = {
                'id' : subsheet.get('subsheetid'),
                'type' : subsheet.get('type'),
                'published' : subsheet.get('published'),
            }
            
            # name
            sub_dict['name'] = subsheet.find('.//proc:name', ns).text if subsheet.find('.//proc:name', ns) is not None else None
            
            # view
            element = subsheet.find('.//proc:view', ns)
            if element is not None:
                sub_dict['view'] = {
                    'camerax' : float(element.find('.//proc:camerax', ns).text) if element.find('.//proc:camerax', ns) is not None else None,
                    'cameray' : float(element.find('.//proc:cameray', ns).text) if element.find('.//proc:cameray', ns) is not None else None,
                    'zoom' : float(element.find('.//proc:zoom', ns).text) if element.find('.//proc:zoom', ns) is not None else None,
                }
            
            dict_root['process']['subsheetlist'].append(sub_dict)
        
        for stage in proc.findall('.//proc:stage', ns):
            stage_dict = {
                'id' : stage.get('stageid'),
                'name' : stage.get('name'),
                'type' : stage.get('type'),
                'subsheetid' :  '',
                'private' : False,
                'loginhibit' : False,
                'alwaysinit' : False,
            }
            
            # display
            element = stage.find('.//proc:display', ns)
            if element is not None:
                stage_dict['x'] = float(element.get('x')) if element.get('x') is not None else None
                stage_dict['y'] = float(element.get('y')) if element.get('y') is not None else None
                stage_dict['w'] = float(element.get('w')) if element.get('w') is not None else None
                stage_dict['h'] = float(element.get('h')) if element.get('h') is not None else None
            
            # font
            element = stage.find('.//proc:font', ns)
            if element is not None:
                stage_dict['fontcolor'] = '#' + str(element.get('color')) if element.get('color') is not None else None
                stage_dict['fontsize'] = int(element.get('size')) if element.get('size') is not None else None
            
            # onsuccess
            element = stage.find('.//proc:onsuccess', ns)
            if element is not None:
                stage_dict['onsuccess'] = element.text
            
            # narrative
            element = stage.find('.//proc:narrative', ns)
            if element is not None:
                stage_dict['narrative'] = element.text
            
            # subsheetid
            element = stage.find('.//proc:subsheetid', ns)
            if element is not None:
                stage_dict['subsheetid'] = element.text
            
            # processid
            element = stage.find('.//proc:processid', ns)
            if element is not None:
                stage_dict['processid'] = element.text
                
            # ontrue
            element = stage.find('.//proc:ontrue', ns)
            if element is not None:
                stage_dict['ontrue'] = element.text
                
            # onfalse
            element = stage.find('.//proc:onfalse', ns)
            if element is not None:
                stage_dict['onfalse'] = element.text
            
            # outputs
            element = stage.find('.//proc:outputs', ns)
            if element is not None:
                outputs = element.findall('.//proc:output', ns)
                stage_dict['outputs'] = []
                for output in outputs:
                    output_obj = {
                        'type' : output.get('type'),
                        'name' : output.get('name'),
                        'friendlyname' : output.get('friendlyname'),
                        'stage' : output.get('stage'),
                    }
                    stage_dict['outputs'].append(output_obj)
            
            # inputs
            element = stage.find('.//proc:inputs', ns)
            if element is not None:
                inputs = element.findall('.//proc:input', ns)
                stage_dict['inputs'] = []
                for input in inputs:
                    input_obj = {
                        'type' : input.get('type'),
                        'name' : input.get('name'),
                        'friendlyname' : input.get('friendlyname'),
                        'stage' : input.get('stage'),
                        'expr' : input.get('expr'),
                    }
                    stage_dict['inputs'].append(input_obj)
            
            # decision
            element = stage.find('.//proc:decision', ns)
            if element is not None:
                stage_dict['decision'] = element.get('expression')
            
            # exception
            element = stage.find('.//proc:exception', ns)
            if element is not None:
                stage_dict['exception'] = {
                    'localized' : element.get('localized'),
                    'type' : element.get('type'),
                    'detail' : element.get('detail'),
                }
            
            # loginhibit
            element = stage.find('.//proc:loginhibit', ns)
            if element is not None:
                stage_dict['loginhibit'] = bool(element.get('onsuccess')) if element.get('onsuccess') is not None else True
            
            # groupid
            element = stage.find('.//proc:groupid', ns)
            if element is not None:
                stage_dict['groupid'] = element.text
            
            # looptype
            element = stage.find('.//proc:looptype', ns)
            if element is not None:
                stage_dict['looptype'] = element.text
            
            # loopdata
            element = stage.find('.//proc:loopdata', ns)
            if element is not None:
                stage_dict['loopdata'] = element.text
            
            # datatype
            element = stage.find('.//proc:datatype', ns)
            if element is not None:
                stage_dict['datatype'] = element.text
            
            # private
            element = stage.find('.//proc:private', ns)
            if element is not None:
                stage_dict['private'] = True
            
            # alwaysinit
            element = stage.find('.//proc:alwaysinit', ns)
            if element is not None:
                stage_dict['alwaysinit'] = True
            
            # collectioninfo
            element = stage.find('.//proc:collectioninfo', ns)
            if element is not None:
                stage_dict['collectioninfo'] = []
                fields = element.findall('.//proc:field', ns)
                for field in fields:
                    field_dict = {
                        'name' : field.get('name'),
                        'type' : field.get('type'),
                    }
                    stage_dict['collectioninfo'].append(field_dict)
            
            # initialvalue
            element = stage.find('.//proc:initialvalue', ns)
            if element is not None:
                stage_dict['initialvalue'] = []
                rows = element.findall('.//proc:row', ns)
                for i, row in enumerate(rows):
                    stage_dict['initialvalue'].append([])
                    fields = row.findall('.//proc:field', ns)
                    for field in fields:
                        field_dict = {
                            'name' : field.get('name'),
                            'type' : field.get('type'),
                            'value' : field.get('value'),
                        }
                        stage_dict['initialvalue'][i].append(field_dict)
            
            # resource
            element = stage.find('.//proc:resource', ns)
            if element is not None:
                stage_dict['resource'] = {
                    'object' : element.get('object'),
                    'action' : element.get('action'),
                }
            
            # steps
            element = stage.find('.//proc:steps', ns)
            if element is not None:
                calcs = element.findall('.//proc:calculation', ns)
                stage_dict['steps'] = []
                for calc in calcs:
                    calc_dict = {
                        'expression' : calc.get('expression'),
                        'stage' : calc.get('stage'),
                    }
                    stage_dict['steps'].append(calc_dict)
            
            # choices
            element = stage.find('.//proc:choices', ns)
            if element is not None:
                stage_dict['choices'] = []
                choices = element.findall('.//proc:choice', ns)
                for choice in choices:
                    choice_dict = {
                        'name' : choice.find('.//proc:name', ns).text if choice.find('.//proc:name', ns) is not None else None,
                        'distance' : float(choice.find('.//proc:distance', ns).text) if choice.find('.//proc:distance', ns) is not None else None,
                        'ontrue' : choice.find('.//proc:ontrue', ns).text if choice.find('.//proc:ontrue', ns) is not None else None,
                    }
                    stage_dict['choices'].append(choice_dict)
            
            dict_root['process']['stagelist'].append(stage_dict)
    
    # outer object
    obj = file_root.find('.//proc:object', ns)
    
    if obj is not None:
        inner_proc = obj.find('.//proc:process', ns)
        dict_root['object'] = {
            'id' : obj.get('id'),
            'name' : obj.get('name'),
            'xmlns' : obj.get('xmlns'),
        }
        if inner_proc is not None:
            dict_root['object']['version'] = inner_proc.get('version')
            dict_root['object']['bpversion'] = inner_proc.get('bpversion')
            dict_root['object']['narrative'] = inner_proc.get('narrative')
            dict_root['object']['byrefcollection'] = inner_proc.get('byrefcollection')
            dict_root['object']['subsheetlist'] = []
            dict_root['object']['stagelist'] = []
        
        #view
        element = inner_proc.find('.//proc:view', ns)
        if element is not None:
            dict_root['object']['view'] = {
                'camerax' : float(element.find('.//proc:camerax', ns).text) if element.find('.//proc:camerax', ns) is not None else None,
                'cameray' : float(element.find('.//proc:cameray', ns).text) if element.find('.//proc:cameray', ns) is not None else None,
                'zoom' : float(element.find('.//proc:zoom', ns).text) if element.find('.//proc:zoom', ns) is not None else None,
            }
        
        # preconditions
        preconditions_element = proc.find('.//proc:preconditions', ns)
        if preconditions_element is not None:
            dict_root['object']['preconditions'] = []
            conditions = preconditions_element.findall('.//proc:condition', ns)
            for condition in conditions:
                dict_root['object']['preconditions'].append(condition.get('narrative'))
        
        # endpoint
        dict_root['object']['endpoint'] = obj.find('.//proc:preconditions', ns).get('narrative') if obj.find('.//proc:preconditions', ns) is not None else None

        # subsheets
        for subsheet in obj.findall('.//proc:subsheet', ns):
            sub_dict = {
                'id' : subsheet.get('subsheetid'),
                'type' : subsheet.get('type'),
                'published' : subsheet.get('published'),
            }
            
            # name
            sub_dict['name'] = subsheet.find('.//proc:name', ns).text if subsheet.find('.//proc:name', ns) is not None else None
            
            # view
            element = subsheet.find('.//proc:view', ns)
            if element is not None:
                sub_dict['view'] = {
                    'camerax' : float(element.find('.//proc:camerax', ns).text) if element.find('.//proc:camerax', ns) is not None else None,
                    'cameray' : float(element.find('.//proc:cameray', ns).text) if element.find('.//proc:cameray', ns) is not None else None,
                    'zoom' : float(element.find('.//proc:zoom', ns).text) if element.find('.//proc:zoom', ns) is not None else None,
                }
            
            dict_root['object']['subsheetlist'].append(sub_dict)
        
        for stage in obj.findall('.//proc:stage', ns):
            stage_dict = {
                'id' : stage.get('stageid'),
                'name' : stage.get('name'),
                'type' : stage.get('type'),
                'subsheetid' :  '',
                'private' : False,
                'loginhibit' : False,
                'alwaysinit' : False,
            }
            
            # display
            element = stage.find('.//proc:display', ns)
            if element is not None:
                stage_dict['x'] = float(element.get('x')) if element.get('x') is not None else None
                stage_dict['y'] = float(element.get('y')) if element.get('y') is not None else None
                stage_dict['w'] = float(element.get('w')) if element.get('w') is not None else None
                stage_dict['h'] = float(element.get('h')) if element.get('h') is not None else None
            
            # font
            element = stage.find('.//proc:font', ns)
            if element is not None:
                stage_dict['fontcolor'] = '#' + str(element.get('color')) if element.get('color') is not None else None
                stage_dict['fontsize'] = int(element.get('size')) if element.get('size') is not None else None
            
            # onsuccess
            element = stage.find('.//proc:onsuccess', ns)
            if element is not None:
                stage_dict['onsuccess'] = element.text
            
            # narrative
            element = stage.find('.//proc:narrative', ns)
            if element is not None:
                stage_dict['narrative'] = element.text
            
            # subsheetid
            element = stage.find('.//proc:subsheetid', ns)
            if element is not None:
                stage_dict['subsheetid'] = element.text
            
            # processid
            element = stage.find('.//proc:processid', ns)
            if element is not None:
                stage_dict['processid'] = element.text
                
            # ontrue
            element = stage.find('.//proc:ontrue', ns)
            if element is not None:
                stage_dict['ontrue'] = element.text
                
            # onfalse
            element = stage.find('.//proc:onfalse', ns)
            if element is not None:
                stage_dict['onfalse'] = element.text
            
            # outputs
            element = stage.find('.//proc:outputs', ns)
            if element is not None:
                outputs = element.findall('.//proc:output', ns)
                stage_dict['outputs'] = []
                for output in outputs:
                    output_obj = {
                        'type' : output.get('type'),
                        'name' : output.get('name'),
                        'friendlyname' : output.get('friendlyname'),
                        'stage' : output.get('stage'),
                    }
                    stage_dict['outputs'].append(output_obj)
            
            # inputs
            element = stage.find('.//proc:inputs', ns)
            if element is not None:
                inputs = element.findall('.//proc:input', ns)
                stage_dict['inputs'] = []
                for input in inputs:
                    input_obj = {
                        'type' : input.get('type'),
                        'name' : input.get('name'),
                        'friendlyname' : input.get('friendlyname'),
                        'stage' : input.get('stage'),
                        'expr' : input.get('expr'),
                    }
                    stage_dict['inputs'].append(input_obj)
            
            # decision
            element = stage.find('.//proc:decision', ns)
            if element is not None:
                stage_dict['decision'] = element.get('expression')
            
            # exception
            element = stage.find('.//proc:exception', ns)
            if element is not None:
                stage_dict['exception'] = {
                    'localized' : element.get('localized'),
                    'type' : element.get('type'),
                    'detail' : element.get('detail'),
                }
            
            # loginhibit
            element = stage.find('.//proc:loginhibit', ns)
            if element is not None:
                stage_dict['loginhibit'] = bool(element.get('onsuccess')) if element.get('onsuccess') is not None else True
            
            # groupid
            element = stage.find('.//proc:groupid', ns)
            if element is not None:
                stage_dict['groupid'] = element.text
            
            # looptype
            element = stage.find('.//proc:looptype', ns)
            if element is not None:
                stage_dict['looptype'] = element.text
            
            # loopdata
            element = stage.find('.//proc:loopdata', ns)
            if element is not None:
                stage_dict['loopdata'] = element.text
            
            # datatype
            element = stage.find('.//proc:datatype', ns)
            if element is not None:
                stage_dict['datatype'] = element.text
            
            # private
            element = stage.find('.//proc:private', ns)
            if element is not None:
                stage_dict['private'] = True
            
            # alwaysinit
            element = stage.find('.//proc:alwaysinit', ns)
            if element is not None:
                stage_dict['alwaysinit'] = True
            
            # collectioninfo
            element = stage.find('.//proc:collectioninfo', ns)
            if element is not None:
                stage_dict['collectioninfo'] = []
                fields = element.findall('.//proc:field', ns)
                for field in fields:
                    field_dict = {
                        'name' : field.get('name'),
                        'type' : field.get('type'),
                    }
                    stage_dict['collectioninfo'].append(field_dict)
            
            # initialvalue
            element = stage.find('.//proc:initialvalue', ns)
            if element is not None:
                stage_dict['initialvalue'] = []
                rows = element.findall('.//proc:row', ns)
                for i, row in enumerate(rows):
                    stage_dict['initialvalue'].append([])
                    fields = row.findall('.//proc:field', ns)
                    for field in fields:
                        field_dict = {
                            'name' : field.get('name'),
                            'type' : field.get('type'),
                            'value' : field.get('value'),
                        }
                        stage_dict['initialvalue'][i].append(field_dict)
            
            # resource
            element = stage.find('.//proc:resource', ns)
            if element is not None:
                stage_dict['resource'] = {
                    'object' : element.get('object'),
                    'action' : element.get('action'),
                }
            
            # steps
            element = stage.find('.//proc:steps', ns)
            if element is not None:
                calcs = element.findall('.//proc:calculation', ns)
                stage_dict['steps'] = []
                for calc in calcs:
                    calc_dict = {
                        'expression' : calc.get('expression'),
                        'stage' : calc.get('stage'),
                    }
                    stage_dict['steps'].append(calc_dict)
            
            # choices
            element = stage.find('.//proc:choices', ns)
            if element is not None:
                stage_dict['choices'] = []
                choices = element.findall('.//proc:choice', ns)
                for choice in choices:
                    choice_dict = {
                        'name' : choice.find('.//proc:name', ns).text if choice.find('.//proc:name', ns) is not None else None,
                        'distance' : choice.find('.//proc:distance', ns).text if choice.find('.//proc:distance', ns) is not None else None,
                        'ontrue' : choice.find('.//proc:ontrue', ns).text if choice.find('.//proc:ontrue', ns) is not None else None,
                    }
                    stage_dict['choices'].append(choice_dict)
            
            dict_root['object']['stagelist'].append(stage_dict)
    
    return dict_root

def main():
    # printing the time and date
    today = date.today()
    print("Today's date:", today)
    reset_db_filt()
    xml_list = pull_from_db_sens('customer')
    for item in xml_list:
        name = item[1]
        content = item[2]
        dict_root = analyze(content)
        id = str(dict_root['process']['id'])
        json_list = json.dumps(dict_root)
        push_to_db_filt(id, name, json_list)

main()